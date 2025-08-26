#!/bin/bash

# Seznam HTML souborů, které chceme upravit
HTML_FILES=(
  "index.html"
  "investicni-kalkulacka.html"
  "kalkulacka-prescoring.html"
  "kalkulacka-ztracenych-prilezitosti.html"
  "najem-vs-hypoteka.html"
  "refinancování.html"
  "spoluprace.html"
  "template.html"
  "analyzahypoteky.html"
  "jaknato.html"
)

for file in "${HTML_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Upravuji soubor: $file"
    
    # Vytvoření dočasného souboru
    cp "$file" "$file.tmp"
    
    # Hledání řádku s body tagem
    BODY_LINE=$(grep -n "<body" "$file.tmp" | head -1 | cut -d: -f1)
    
    if [ -z "$BODY_LINE" ]; then
      echo "  CHYBA: body tag nenalezen v $file"
      rm "$file.tmp"
      continue
    fi
    
    # Hledání řádku s </body> tagem
    END_BODY_LINE=$(grep -n "</body>" "$file.tmp" | head -1 | cut -d: -f1)
    
    if [ -z "$END_BODY_LINE" ]; then
      echo "  CHYBA: uzavírací body tag nenalezen v $file"
      rm "$file.tmp"
      continue
    fi
    
    echo "  Body tag nalezen na řádku $BODY_LINE, uzavírací tag na řádku $END_BODY_LINE"
    
    # Odstraníme legacy include skripty (fetch/XMLHttpRequest) uvnitř <script> bloků kompatibilně s macOS pomocí awk
    awk '
      BEGIN{inblock=0;buf=""}
      function flush(){
        if (buf ~ /nav\.html|footer\.html|XMLHttpRequest/) {
          # drop this script block
        } else {
          printf "%s", buf
        }
        buf=""; inblock=0
      }
      {
        if (inblock) {
          buf = buf $0 ORS
          if ($0 ~ /<\/script>/) { flush() }
          next
        }
        if ($0 ~ /<script[^"]*>/) {
          inblock=1; buf = $0 ORS
          if ($0 ~ /<\/script>/) { flush() }
          next
        }
        print
      }
    ' "$file.tmp" > "$file.tmp.awk" && mv "$file.tmp.awk" "$file.tmp"
    
    # Smaže případné placeholdery kontejnerů, budeme je přidávat znovu jednotně (jednořádkové)
    sed -i.bak -E 's/<div id="nav-container"><\/div>//g' "$file.tmp"
    sed -i.bak -E 's/<div id="footer-container"><\/div>//g' "$file.tmp"
    
    # Odstraníme původní navigaci pokud existuje
    sed -i.bak -E '/<!-- Plovoucí navigace -->|<header class="fixed top-0 left-0 right-0 z-50">/,/<\/header>/d' "$file.tmp"
    
    # Odstraníme původní footer pokud existuje
    sed -i.bak -E '/<footer class="bg-white">/,/<\/footer>/d' "$file.tmp"
    
    # Zjistíme, zda už jsou přítomné kontejnery a includes.js
    HAS_NAV=0; HAS_FOOTER=0; HAS_INC=0
    grep -q 'id="nav-container"' "$file.tmp" && HAS_NAV=1
    grep -q 'id="footer-container"' "$file.tmp" && HAS_FOOTER=1
    grep -q 'includes\.js' "$file.tmp" && HAS_INC=1

    # Vložíme chybějící prvky pomocí awk: po <body> nav-container; před </body> footer-container a includes.js
    awk -v has_nav="$HAS_NAV" -v has_footer="$HAS_FOOTER" -v has_inc="$HAS_INC" '
      {
        printed=0
        if ($0 ~ /<body[^>]*>/ && has_nav==0) {
          print $0
          print "<div id=\"nav-container\"></div>"
          printed=1
        }
        if ($0 ~ /<\/body>/) {
          if (has_footer==0) {
            print "<div id=\"footer-container\"></div>"
          }
          if (has_inc==0) {
            print "<script src=\"includes.js\"></script>"
          }
        }
        if (printed==0) print $0
      }
    ' "$file.tmp" > "$file.tmp.inject" && mv "$file.tmp.inject" "$file.tmp"
    
    # Přesuneme upravený soubor zpět
    mv "$file.tmp" "$file"
    echo "  Úpravy dokončeny"
  else
    echo "Soubor $file nenalezen"
  fi
done

# Odstranění dočasných souborů
rm -f *.bak *.tmp

echo "Hotovo! Všechny soubory byly upraveny."
