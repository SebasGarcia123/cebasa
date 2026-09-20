import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

// Envío de avisos (OC generada, enviada al proveedor, etc.). Sin las
// variables SMTP_* en .env, no hay transporte configurado: el mensaje
// se deja logueado en vez de enviarse, para no romper el flujo que lo
// dispara (generar una OC no puede fallar porque no haya credenciales
// de mail cargadas todavía). Apenas se completen SMTP_HOST/PORT/USER/PASS,
// empieza a enviar de verdad sin tocar código.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    this.transporter =
      SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
        ? createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
          })
        : null;
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[email no configurado] Para: ${message.to} | Asunto: ${message.subject}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: message.to,
        subject: message.subject,
        html: message.html,
      });
    } catch (error) {
      // Un email que no sale no puede tirar abajo la operación que lo
      // disparó (generar/enviar una OC ya se guardó en la base).
      this.logger.error(`No se pudo enviar el email a ${message.to}`, error);
    }
  }
}
