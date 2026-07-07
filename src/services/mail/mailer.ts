import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
} as any);

transporter.verify((error: any, success: any) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server is ready to send messages');
    }
});

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
    // ✅ FIX: URL harus mengarah ke API Route, bukan halaman
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

    console.log('📧 Sending verification email to:', email);
    console.log('🔗 Verification URL:', verificationUrl);

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Verifikasi Akun - Terbangin',
            html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 100%); border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #2563EB 0%, #38BDF8 100%); border-radius: 12px; color: white; font-weight: bold; font-size: 20px;">
              <span>✈️</span>
              <span>Terbangin</span>
            </div>
          </div>
          
          <h2 style="color: #1E293B; margin-bottom: 16px; text-align: center;">Halo ${name}! 👋</h2>
          <p style="color: #64748B; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Terima kasih telah mendaftar di Terbangin. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563EB 0%, #38BDF8 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);">
              Verifikasi Email Saya
            </a>
          </div>
          
          <p style="color: #94A3B8; font-size: 14px; text-align: center; margin-top: 32px;">
            Atau salin link berikut:<br/>
            <span style="color: #2563EB; word-break: break-all;">${verificationUrl}</span>
          </p>
          
          <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px;">
            Link ini akan kadaluarsa dalam 24 jam.<br/>
            Jika Anda tidak mendaftar, abaikan email ini.
          </p>
        </div>
      `,
        });

        console.log(`✅ Email sent to ${email}, Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw new Error('Gagal mengirim email verifikasi');
    }
};

export interface BookingConfirmationEmailParams {
    email: string;
    name: string;
    bookingCode: string;
    bookingId: string;
    flightNumber: string;
    airlineName: string;
    departureCity: string;
    arrivalCity: string;
    departureTime: Date;
    totalPrice: string;
}

export const sendBookingConfirmationEmail = async (params: BookingConfirmationEmailParams) => {
    const {
        email,
        name,
        bookingCode,
        bookingId,
        flightNumber,
        airlineName,
        departureCity,
        arrivalCity,
        departureTime,
        totalPrice,
    } = params;

    const formattedDate = departureTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(totalPrice));

    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/customer/payment/${bookingId}`;

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: `E-Ticket Dikonfirmasi - ${bookingCode}`,
            html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 100%); border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #2563EB 0%, #38BDF8 100%); border-radius: 12px; color: white; font-weight: bold; font-size: 20px;">
              <span>✈️</span>
              <span>Terbangin</span>
            </div>
          </div>

          <h2 style="color: #1E293B; margin-bottom: 16px; text-align: center;">Pembayaran Berhasil, ${name}! 🎉</h2>
          <p style="color: #64748B; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            E-ticket Anda telah aktif. Simpan kode booking berikut untuk check-in.
          </p>

          <div style="background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;">KODE BOOKING</div>
              <div style="font-size: 28px; font-weight: bold; color: #2563EB; letter-spacing: 2px;">${bookingCode}</div>
            </div>
            <div style="border-top: 1px dashed #E2E8F0; padding-top: 16px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${airlineName} — ${flightNumber}</div>
              <div style="color: #64748B; font-size: 14px;">${departureCity} → ${arrivalCity}</div>
              <div style="color: #64748B; font-size: 14px; margin-top: 4px;">${formattedDate}</div>
              <div style="margin-top: 12px; font-weight: bold; color: #1E293B;">Total: ${formattedPrice}</div>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${ticketUrl}"
               style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563EB 0%, #38BDF8 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
              Lihat E-Ticket
            </a>
          </div>

          <p style="color: #94A3B8; font-size: 12px; text-align: center;">
            Datang ke bandara minimal 2 jam sebelum keberangkatan.<br/>
            Tunjukkan kode booking ini di counter check-in.
          </p>
        </div>
      `,
        });

        console.log(`✅ Confirmation email sent to ${email}, Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
        throw new Error('Gagal mengirim email konfirmasi booking');
    }
};