#!/bin/bash
# Genera le clip audio da voce/testi.json usando una voce di sistema del Mac.
# Uso:  ./genera-voce.sh "Alice (Enhanced)" it
# Reincide una clip se il testo e' cambiato OPPURE se e' cambiata la voce.
set -u
VOCE="${1:?manca il nome della voce — vedi: say -v '?'}"
LINGUA="${2:-it}"
PARALLELE="${3:-4}"
QUI="$(cd "$(dirname "$0")" && pwd)"
OUT="$QUI/clip/$LINGUA"
mkdir -p "$OUT/.testi"

incidi() {
  id="$1"; testo="$2"; voce="$3"; out="$4"
  vecchio=$(cat "$out/.testi/$id.txt" 2>/dev/null || true)
  if [ -f "$out/$id.m4a" ] && [ "$vecchio" = "$voce|$testo" ]; then exit 0; fi
  say -v "$voce" -o "$out/$id.aiff" "$testo" || exit 0
  ffmpeg -v error -y -i "$out/$id.aiff" -c:a aac -b:a 40k -ac 1 "$out/$id.m4a" || exit 0
  rm -f "$out/$id.aiff"
  printf '%s' "$voce|$testo" > "$out/.testi/$id.txt"
  printf '.'
}
export -f incidi
export VOCE_X="$VOCE"
export OUT_X="$OUT"

node -e '
const fs=require("fs");
const clip=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
clip.forEach(c=>console.log(c.id+"\t"+c.testo.replace(/[\t\n\r]+/g," ")));
' "$QUI/testi.json" \
| awk -F'\t' -v OFS='\0' 'NF>=2{printf "%s%c%s%c", $1, 0, $2, 0}' \
| xargs -0 -n 2 -P "$PARALLELE" bash -c 'incidi "$0" "$1" "$VOCE_X" "$OUT_X"' \
  2>/dev/null

echo
echo "fatte: $(ls -1 "$OUT"/*.m4a 2>/dev/null | wc -l | tr -d ' ') clip in $OUT"
du -sh "$OUT"
