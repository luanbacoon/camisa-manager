import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getDb } from "../db";
import { backups } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { storagePut, storageGet } from "../storage";

const execAsync = promisify(exec);

const BACKUP_CONFIG = {
  MAX_BACKUPS: 30, // Manter últimos 30 backups
  BACKUP_DIR: "/tmp/camisa-manager-backups",
  RETENTION_DAYS: 90, // Manter backups por 90 dias
};

/**
 * Upload de backup para S3
 */
export async function uploadBackupToS3(filename: string, filepath: string): Promise<{ key: string; url: string }> {
  try {
    const fileContent = await readFile(filepath);
    const result = await storagePut(`backups/${filename}`, fileContent, "application/sql");
    return result;
  } catch (error) {
    console.error("Erro ao fazer upload de backup para S3:", error);
    throw error;
  }
}

/**
 * Criar backup do banco de dados
 */
export async function createBackup(description?: string): Promise<{
  backupId: number;
  filename: string;
  size: number;
  createdAt: Date;
}> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    const filepath = join(BACKUP_CONFIG.BACKUP_DIR, filename);

    // Criar diretório se não existir
    await execAsync(`mkdir -p ${BACKUP_CONFIG.BACKUP_DIR}`);

    // Executar mysqldump
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL not configured");

    // Extrair credenciais da URL
    const url = new URL(databaseUrl);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const database = url.pathname.slice(1);

    const dumpCommand = `mysqldump -h ${host} -u ${user} -p${password} ${database} > ${filepath}`;

    await execAsync(dumpCommand);

    // Obter tamanho do arquivo
    const { stdout } = await execAsync(`ls -lh ${filepath} | awk '{print $5}'`);
    const size = stdout.trim();

    // Registrar backup no banco de dados
    const result = await db.insert(backups).values({
      filename,
      description: description || `Backup automático - ${new Date().toLocaleString("pt-BR")}`,
      size,
      status: "completed",
      createdAt: new Date(),
    });

    // Limpar backups antigos
    await cleanupOldBackups();

    return {
      backupId: result[0].insertId as number,
      filename,
      size: parseInt(size) || 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao criar backup:", error);

    // Registrar erro no banco
    const db = await getDb();
    if (db) {
      await db.insert(backups).values({
        filename: `backup-failed-${Date.now()}`,
        description: `Erro ao criar backup: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        size: "0",
        status: "failed",
        createdAt: new Date(),
      });
    }

    throw error;
  }
}

/**
 * Restaurar backup
 */
export async function restoreBackup(backupId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  try {
    // Obter informações do backup
    const backup = await db
      .select()
      .from(backups)
      .where(eq(backups.id, backupId))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!backup) throw new Error("Backup não encontrado");

    const filepath = join(BACKUP_CONFIG.BACKUP_DIR, backup.filename);

    // Extrair credenciais da URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL not configured");

    const url = new URL(databaseUrl);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const database = url.pathname.slice(1);

    // Restaurar backup
    const restoreCommand = `mysql -h ${host} -u ${user} -p${password} ${database} < ${filepath}`;
    await execAsync(restoreCommand);

    // Atualizar status do backup
    await db
      .update(backups)
      .set({ restoredAt: new Date() })
      .where(eq(backups.id, backupId));

    console.log(`Backup ${backup.filename} restaurado com sucesso`);
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    throw error;
  }
}

/**
 * Listar backups
 */
export async function listBackups(limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  return db
    .select()
    .from(backups)
    .orderBy(desc(backups.createdAt))
    .limit(limit);
}

/**
 * Deletar backup
 */
export async function deleteBackup(backupId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  try {
    // Obter informações do backup
    const backup = await db
      .select()
      .from(backups)
      .where(eq(backups.id, backupId))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!backup) throw new Error("Backup não encontrado");

    // Deletar arquivo
    const filepath = join(BACKUP_CONFIG.BACKUP_DIR, backup.filename);
    await execAsync(`rm -f ${filepath}`);

    // Deletar registro do banco
    await db.delete(backups).where(eq(backups.id, backupId));
  } catch (error) {
    console.error("Erro ao deletar backup:", error);
    throw error;
  }
}

/**
 * Limpar backups antigos
 */
export async function cleanupOldBackups(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  try {
    // Obter todos os backups ordenados por data
    const allBackups = await db
      .select()
      .from(backups)
      .orderBy(desc(backups.createdAt));

    // Manter apenas os últimos MAX_BACKUPS
    if (allBackups.length > BACKUP_CONFIG.MAX_BACKUPS) {
      const backupsToDelete = allBackups.slice(BACKUP_CONFIG.MAX_BACKUPS);

      for (const backup of backupsToDelete) {
        try {
          const filepath = join(BACKUP_CONFIG.BACKUP_DIR, backup.filename);
          await execAsync(`rm -f ${filepath}`);
          await db.delete(backups).where(eq(backups.id, backup.id));
        } catch (error) {
          console.error(`Erro ao deletar backup antigo ${backup.filename}:`, error);
        }
      }
    }

    // Deletar backups com mais de RETENTION_DAYS dias
    const retentionDate = new Date(Date.now() - BACKUP_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const oldBackups = allBackups.filter((b) => new Date(b.createdAt) < retentionDate);

    for (const backup of oldBackups) {
      try {
        const filepath = join(BACKUP_CONFIG.BACKUP_DIR, backup.filename);
        await execAsync(`rm -f ${filepath}`);
        await db.delete(backups).where(eq(backups.id, backup.id));
      } catch (error) {
        console.error(`Erro ao deletar backup expirado ${backup.filename}:`, error);
      }
    }
  } catch (error) {
    console.error("Erro ao limpar backups antigos:", error);
  }
}

/**
 * Obter estatísticas de backup
 */
export async function getBackupStats() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const allBackups = await db.select().from(backups);

  const completedBackups = allBackups.filter((b) => b.status === "completed");
  const failedBackups = allBackups.filter((b) => b.status === "failed");
  const totalSize = completedBackups.reduce((sum, b) => sum + (parseInt(b.size) || 0), 0);

  const lastBackup = completedBackups.length > 0 ? completedBackups[0] : null;
  const lastRestore = allBackups
    .filter((b) => b.restoredAt)
    .sort((a, b) => (b.restoredAt?.getTime() || 0) - (a.restoredAt?.getTime() || 0))[0];

  return {
    totalBackups: allBackups.length,
    completedBackups: completedBackups.length,
    failedBackups: failedBackups.length,
    totalSize,
    lastBackup,
    lastRestore,
  };
}
