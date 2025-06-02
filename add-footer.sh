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
)

# Kód pro vložení před konec </body> tagu
FOOTER_INCLUDE='
    <!-- Footer include -->
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
    
    # Hledání původního footeru
    FOOTER_START=$(grep -n "<!-- Footer -->" "$file" | head -1 | cut -d: -f1)
    FOOTER_END=$(grep -n "</footer>" "$file" | tail -1 | cut -d: -f1)
    
    if [ ! -z "$FOOTER_START" ] && [ ! -z "$FOOTER_END" ]; then
      echo "  Nalezen footer v řádcích $FOOTER_START-$FOOTER_END"
      
      # Vytvoření dočasného souboru
      cp "$file" "$file.tmp"
      
      # Nahrazení footeru
      head -n $((FOOTER_START-1)) "$file" > "$file.new"
      echo "$FOOTER_INCLUDE" >> "$file.new"
      tail -n +$((FOOTER_END+1)) "$file" >> "$file.new"
      
      # Náhrada originálního souboru
      mv "$file.new" "$file"
      
      echo "  Footer nahrazen externím include"
    else
      echo "  Footer nenalezen, přidávám před konec </body>"
      
      # Pokud není nalezen footer, přidáme include před konec body tagu
      sed -i.bak "s|</body>|${FOOTER_INCLUDE}\n</body>|" "$file"
      
      echo "  Footer include přidán"
    fi
  else
    echo "Soubor $file nenalezen"
  fi
done

echo "Hotovo! Footer byl přidán do všech HTML souborů."
