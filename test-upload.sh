#!/bin/bash
# Criar uma imagem de teste
convert -size 100x100 xc:blue /tmp/test.jpg 2>/dev/null || echo "ImageMagick not available"

# Tentar fazer upload
if [ -f /tmp/test.jpg ]; then
  curl -X POST http://localhost:3000/api/upload \
    -H "Content-Type: image/jpeg" \
    --data-binary @/tmp/test.jpg 2>/dev/null | head -20
else
  echo "Test image not created"
fi
