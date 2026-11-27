<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DefenseScheduleMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public string $mhsNama,
        public string $mhsNim,
        public string $prodi,
        public string $judul,
        public string $jenisSidang,
        public string $tanggal,
        public string $waktuMulai,
        public string $waktuSelesai,
        public string $ruangan,
        public string $ketuaPenguji = '',
        public string $sekretaris = '',
        public string $penguji1 = '',
        public string $penguji2 = '',
        public string $catatan = '',
        public string $linkBerkas = '',
        public bool $isUpdate = false,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $prefix = $this->isUpdate ? 'Pembaruan Jadwal' : 'Undangan & Jadwal';

        return new Envelope(
            subject: "{$prefix} {$this->jenisSidang} — SIMONITA FASILKOM UNSRI",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.defense-schedule',
            with: [
                'mhsNama' => $this->mhsNama,
                'mhsNim' => $this->mhsNim,
                'prodi' => $this->prodi,
                'judul' => $this->judul,
                'jenisSidang' => $this->jenisSidang,
                'tanggal' => $this->tanggal,
                'waktuMulai' => $this->waktuMulai,
                'waktuSelesai' => $this->waktuSelesai,
                'ruangan' => $this->ruangan,
                'ketuaPenguji' => $this->ketuaPenguji,
                'sekretaris' => $this->sekretaris,
                'penguji1' => $this->penguji1,
                'penguji2' => $this->penguji2,
                'catatan' => $this->catatan,
                'linkBerkas' => $this->linkBerkas,
                'isUpdate' => $this->isUpdate,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

