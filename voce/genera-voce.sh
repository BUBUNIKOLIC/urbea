#!/bin/bash
# Genera le clip audio da voce/testi.json usando una voce di sistema del Mac.
# Uso:  ./genera-voce.sh "Alice (ottimizzata)" it
set -e
VOCE="${1:?manca il nome della voce — vedi: say -v '?'}"
LINGUA="${2:-it}"
QUI="$(cd "$(dirname "$0")" && pwd)"
OUT="$QUI/clip/$LINGUA"
mkdir -p "$OUT"

node -e '
const fs=require("fs");
const clip=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
clip.forEach(c=>console.log(c.id+"\t"+c.testo.replace(/[\t\n\r]+/g," ")));
' "$QUI/testi.json" | while IFS=$'\t' read -r id testo; do
  [ -z "$id" ] && continue
  vecchio=$(cat "$OUT/.testi/$id.txt" 2>/dev/null)
  if [ -f "$OUT/$id.m4a" ] && [ "$vecchio" = "$testo" ]; then continue; fi
  say -v "$VOCE" -o "$OUT/$id.aiff" "$testo"
  ffmpeg -v error -y -i "$OUT/$id.aiff" -c:a aac -b:a 64k "$OUT/$id.m4a"
  rm -f "$OUT/$id.aiff"
  mkdir -p "$OUT/.testi"; printf '%s' "$testo" > "$OUT/.testi/$id.txt"
  printf '.'
done
echo
echo "fatte: $(ls -1 "$OUT"/*.m4a 2>/dev/null | wc -l | tr -d ' ') clip in $OUT"
du -sh "$OUT"
