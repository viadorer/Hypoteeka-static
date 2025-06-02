#!/bin/bash

# Seznam HTML souborů, které chceme upravit
HTML_FILES=(
  "index.html"
  "investicni-kalkulacka.html"
  "kalkulacka-prescoring.html"
  "kalkulacka-ztracenych-prilezitosti.html"
  "najem-vs-hypoteka.html"
  "refinancování.html"
  "spoluprace.html"
  "template.html"
  "analyzahypoteky.html"
  "jaknato.html"
)

# Kód pro načítání navigace
NAV_CODE='<!-- Nav include -->
<div id="nav-container"></div>

<script>
    // Načtení navigační lišty ze samostatného souboru
    fetch("nav.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("nav-container").innerHTML = data;
        })
        .catch(error => console.error("Chyba při načítání navigace:", error));
</script>'

# Kód pro načítání footeru
FOOTER_CODE='<!-- Footer include -->
<div id="footer-container"></div>

<script>
    // Načtení footeru ze samostatného souboru
    fetch("footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-container").innerHTML = data;
        })
        .catch(error => console.error("Chyba při načítání footeru:", error));
</script>'

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
    
    # Odstraníme všechny existující include kódy pro navigaci a footer
    sed -i.bak -E '/<!-- Nav include -->|<div id="nav-container">|<div id="nav-placeholder">/,/<\/script>/d' "$file.tmp"
    sed -i.bak -E '/<!-- Footer include -->|<div id="footer-container">|<div id="footer-placeholder">/,/<\/script>/d' "$file.tmp"
    
    # Odstraníme původní navigaci pokud existuje
    sed -i.bak -E '/<!-- Plovoucí navigace -->|<header class="fixed top-0 left-0 right-0 z-50">/,/<\/header>/d' "$file.tmp"
    
    # Odstraníme původní footer pokud existuje
    sed -i.bak -E '/<footer class="bg-white">/,/<\/footer>/d' "$file.tmp"
    
    # Přidáme navigaci po otevíracím body tagu
    BODY_TAG=$(sed -n "${BODY_LINE}p" "$file.tmp")
    NEXT_LINE=$((BODY_LINE + 1))
    
    sed -i.bak -e "${BODY_LINE}a\\${NAV_CODE}" "$file.tmp"
    
    # Přidáme footer před uzavírací body tag
    BEFORE_END_BODY=$((END_BODY_LINE - 1))
    sed -i.bak -e "${BEFORE_END_BODY}a\\${FOOTER_CODE}" "$file.tmp"
    
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
