#!/bin/bash

# Seznam HTML souborů, které chceme upravit
HTML_FILES=(
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

# Kód pro vložení na začátek body tagu
NAV_INCLUDE='<div x-data="{ mobileMenuOpen: false }">
    <!-- Nav include -->
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

for file in "${HTML_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Upravuji soubor: $file"
    
    # Dočasná úprava pro zjištění řádku <body> tagu
    BODY_LINE=$(grep -n "<body" "$file" | head -1 | cut -d: -f1)
    
    if [ ! -z "$BODY_LINE" ]; then
      echo "  Nalezen <body> tag na řádku $BODY_LINE"
      
      # Získání obsahu body tagu
      BODY_TAG=$(sed -n "${BODY_LINE}p" "$file")
      
      # Vytvoření nového souboru s načtením navigační lišty
      sed -i.bak "${BODY_LINE}s|${BODY_TAG}|${BODY_TAG}\n${NAV_INCLUDE}|" "$file"
      
      echo "  Přidána navigační lišta"
      
      # Nyní najdeme případné původní navigační lišty a smažeme je
      HEADER_START=$(grep -n "<!-- Plovoucí navigace -->" "$file" | head -1 | cut -d: -f1)
      if [ ! -z "$HEADER_START" ]; then
        HEADER_END=$(grep -n "</header>" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$HEADER_END" ]; then
          echo "  Nalezena původní navigační lišta v řádcích $HEADER_START-$HEADER_END, odstraňuji..."
          sed -i.bak "${HEADER_START},${HEADER_END}d" "$file"
        fi
      fi
    else
      echo "  CHYBA: <body> tag nenalezen!"
    fi
  else
    echo "Soubor $file nenalezen"
  fi
done

echo "Hotovo! Navigační lišta byla přidána do všech HTML souborů."
