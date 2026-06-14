# Archive Import Files

The CSV files directly inside this folder are active personal archive sources.
Running `npm run archive:update` reads them and updates
`app/data/archiveItems.ts`.

```text
manga-import.csv
manhwa-import.csv
anime-import.csv
webnovel-import.csv
book-import.csv
```

Files inside `examples/` are template documentation only. Import scripts do not
read them. Copy their structure when preparing your own active CSVs.

```text
examples/example-manga-import.csv
examples/example-manhwa-import.csv
examples/example-anime-import.csv
examples/example-webnovel-import.csv
examples/example-book-import.csv
```

Do not place secrets, API keys, passwords, email addresses, or other private
account information in import files. See `ARCHIVE_GUIDE.md` for complete import
and metadata instructions.
