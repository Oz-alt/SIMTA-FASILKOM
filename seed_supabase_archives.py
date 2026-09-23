import openpyxl
import urllib.request
import json
import re
import sys

# Supabase Credentials
SUPABASE_URL = "https://jdubhdapcvjxzmngqyty.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_ZJ0moT-bPUy1slWmSngWVA_KPhyMNMg"

def clean_str(val):
    if val is None:
        return ''
    s = str(val)
    s = re.sub(r'_x000[Dd]_?', ' ', s)
    s = re.sub(r'[\r\n\t]+', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def main():
    print("Memuat data dari data_judul_ta_MI.xlsx...")
    wb = openpyxl.load_workbook('data_judul_ta_MI.xlsx')
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    data = rows[1:]

    records = []
    for idx, r in enumerate(data):
        no = r[0]
        nim = clean_str(r[1])
        nama = clean_str(r[2])
        dosen_pa = clean_str(r[3])
        judul = clean_str(r[4])
        tahun = clean_str(r[5])
        abstrak = clean_str(r[6])
        link_repo = clean_str(r[7])

        item = {
            'id': f'arc-mi-{idx+1:03d}',
            'no': no,
            'nim': nim,
            'nama_mahasiswa': nama,
            'penulis_nama': nama,
            'penulis_nim': nim,
            'dosen_pa': dosen_pa,
            'pembimbing_1': dosen_pa,
            'judul': judul,
            'tahun_ta': tahun,
            'tahun_lulus': tahun,
            'tahun_angkatan': tahun,
            'abstrak': abstrak,
            'link_repo_unsri': link_repo,
            'file_pdf_url': link_repo,
            'prodi': 'D3 Manajemen Informatika',
            'status': 'dipublikasikan'
        }
        records.append(item)

    print(f"Berhasil menyiapkan {len(records)} baris data.")

    # Upload in batches of 50 to Supabase REST API
    batch_size = 50
    endpoint = f"{SUPABASE_URL}/rest/v1/thesis_archives"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    uploaded_count = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        body = json.dumps(batch).encode('utf-8')
        req = urllib.request.Request(endpoint, data=body, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as res:
                uploaded_count += len(batch)
                print(f"Batch {i//batch_size + 1}: Terunggah {uploaded_count}/{len(records)} baris.")
        except Exception as e:
            print(f"\n[Gagal mengunggah ke Supabase]: {e}")
            print("Catatan: Pastikan Anda telah membuat tabel 'thesis_archives' di Supabase SQL Editor.")
            return

    print(f"\nSUKSES! {uploaded_count} baris data real telah diimpor ke Supabase tabel 'thesis_archives'.")

if __name__ == '__main__':
    main()
