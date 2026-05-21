import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Enviar email usando SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!apiKey) {
      console.warn("SENDGRID_API_KEY não configurada");
      return false;
    }

    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@camisamanager.com",
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Enviar email de boas-vindas para novo cliente
 */
export async function sendWelcomeEmail(
  email: string,
  storeName: string,
  loginUrl: string,
  tempPassword: string
): Promise<boolean> {
  const html = `
    <h2>Bem-vindo ao CamisaManager!</h2>
    <p>Olá,</p>
    <p>Sua conta foi criada com sucesso para a loja <strong>${storeName}</strong>.</p>
    
    <h3>Dados de Acesso:</h3>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Senha Temporária:</strong> ${tempPassword}</li>
    </ul>
    
    <h3>Próximos Passos:</h3>
    <ol>
      <li>Acesse: <a href="${loginUrl}">${loginUrl}</a></li>
      <li>Faça login com seus dados</li>
      <li>Altere sua senha (obrigatório na primeira vez)</li>
      <li>Comece a gerenciar sua loja!</li>
    </ol>
    
    <p>Se tiver dúvidas, entre em contato conosco.</p>
    <p>Atenciosamente,<br/>Equipe CamisaManager</p>
  `;

  return sendEmail({
    to: email,
    subject: "Bem-vindo ao CamisaManager!",
    html,
  });
}

/**
 * Enviar email de convite para novo cliente
 */
export async function sendInviteEmail(
  email: string,
  storeName: string,
  inviteLink: string,
  expiresIn: string
): Promise<boolean> {
  const html = `
    <h2>Convite para Gerenciar sua Loja</h2>
    <p>Olá,</p>
    <p>Você foi convidado para gerenciar a loja <strong>${storeName}</strong> usando o CamisaManager.</p>
    
    <h3>Como Começar:</h3>
    <ol>
      <li>Clique no link abaixo</li>
      <li>Crie sua senha</li>
      <li>Comece a gerenciar sua loja!</li>
    </ol>
    
    <p>
      <a href="${inviteLink}" style="background-color: #FCD34D; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Aceitar Convite
      </a>
    </p>
    
    <p><small>Este link expira em ${expiresIn}.</small></p>
    
    <p>Se você não solicitou este convite, ignore este email.</p>
    <p>Atenciosamente,<br/>Equipe CamisaManager</p>
  `;

  return sendEmail({
    to: email,
    subject: `Convite para Gerenciar ${storeName}`,
    html,
  });
}

/**
 * Enviar email de reset de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  expiresIn: string
): Promise<boolean> {
  const html = `
    <h2>Redefinir Sua Senha</h2>
    <p>Olá,</p>
    <p>Você solicitou para redefinir sua senha no CamisaManager.</p>
    
    <p>
      <a href="${resetLink}" style="background-color: #FCD34D; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Redefinir Senha
      </a>
    </p>
    
    <p><small>Este link expira em ${expiresIn}.</small></p>
    
    <p>Se você não solicitou esta ação, ignore este email.</p>
    <p>Atenciosamente,<br/>Equipe CamisaManager</p>
  `;

  return sendEmail({
    to: email,
    subject: "Redefinir sua senha - CamisaManager",
    html,
  });
}
