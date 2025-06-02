#!/bin/bash

# Skript pro přidání základních SEO meta tagů do všech HTML souborů
# Tento skript zajistí konzistentní SEO nastavení napříč celým webem

# Výpis informací o průběhu
echo "Přidávám SEO meta tagy do HTML souborů..."

# Procházení všech HTML souborů kromě nav.html a footer.html
for FILE in $(find . -name "*.html" -not -name "nav.html" -not -name "footer.html"); do
    echo "Zpracovávám soubor: $FILE"
    
    # Kontrola, zda již obsahuje meta description
    if ! grep -q '<meta name="description"' "$FILE"; then
        # Získání názvu stránky z title tagu
        PAGE_TITLE=$(grep -o '<title>.*</title>' "$FILE" | sed 's/<title>\(.*\)<\/title>/\1/')
        
        # Určení popisu stránky podle názvu souboru
        FILENAME=$(basename "$FILE")
        DESCRIPTION="Hypoteeka.cz vám pomůže najít nejvýhodnější hypotéku na míru. Profesionální poradenství a služby pro všechny, kteří hledají cestu k vlastnímu bydlení."
        
        case "$FILENAME" in
            "analyzahypoteky.html")
                DESCRIPTION="Analýza hypotéky vám pomůže zjistit, na jakou hypotéku dosáhnete a kolik budete měsíčně splácet. Profesionální hypoteční kalkulačka pro váš komfort."
                ;;
            "investicni-kalkulacka.html")
                DESCRIPTION="Spočítejte si, jak výhodně můžete investovat místo nájmu. Investiční kalkulačka Hypoteeka.cz pro porovnání nákladů na bydlení."
                ;;
            "jaknato.html")
                DESCRIPTION="Jak získat hypotéku krok za krokem. Průvodce procesem získání hypotéky od odborníků Hypoteeka.cz."
                ;;
            "kalkulacka-prescoring.html")
                DESCRIPTION="Zjistěte předem, jakou výši hypotéky si můžete dovolit. Hypoteční prescoring kalkulačka pro lepší finanční plánování."
                ;;
            "kalkulacka-ztracenych-prilezitosti.html")
                DESCRIPTION="Kalkulačka ztracených příležitostí vám ukáže, kolik peněz ztrácíte odkládáním vlastního bydlení. Spočítejte si svůj potenciál."
                ;;
            "najem-vs-hypoteka.html")
                DESCRIPTION="Porovnejte nájem a hypotéku a zjistěte, která varianta je pro vás výhodnější. Profesionální srovnání od odborníků Hypoteeka.cz."
                ;;
            "refinancování.html")
                DESCRIPTION="Refinancování hypotéky může výrazně snížit vaše měsíční splátky. Zjistěte, jak optimalizovat vaši stávající hypotéku s Hypoteeka.cz."
                ;;
            "spoluprace.html")
                DESCRIPTION="Možnosti spolupráce s Hypoteeka.cz. Připojte se k profesionálnímu týmu hypotečních poradců a rozvíjejte svou kariéru."
                ;;
        esac
        
        # Vytvoření relativní URL pro kanonický odkaz
        CANONICAL_URL="https://www.hypoteeka.cz/$FILENAME"
        if [ "$FILENAME" = "index.html" ]; then
            CANONICAL_URL="https://www.hypoteeka.cz/"
        fi
        
        # Přidání SEO meta tagů - nahrazení hlavičky
        sed -i.bak '/<meta charset="UTF-8">/,/<title>/ {
            /<title>/!d
            /<title>/i\
    <meta charset="UTF-8">\
    <meta name="viewport" content="width=device-width, initial-scale=1.0">\
    <meta name="description" content="'"$DESCRIPTION"'">\
    <meta name="keywords" content="hypotéka, hypoteční poradenství, úvěr na bydlení, refinancování, hypoteční kalkulačka, úroková sazba">\
    <meta name="robots" content="index, follow">\
    <meta name="author" content="Hypoteeka.cz">\
    \
    <!-- Canonical link -->\
    <link rel="canonical" href="'"$CANONICAL_URL"'">\
    \
    <!-- Open Graph meta tags -->\
    <meta property="og:title" content="'"$PAGE_TITLE"'">\
    <meta property="og:description" content="'"$DESCRIPTION"'">\
    <meta property="og:image" content="https://www.hypoteeka.cz/images/og-image.jpg">\
    <meta property="og:url" content="'"$CANONICAL_URL"'">\
    <meta property="og:type" content="website">\
    <meta property="og:site_name" content="Hypoteeka.cz">\
    \
    <!-- Twitter Card meta tags -->\
    <meta name="twitter:card" content="summary_large_image">\
    <meta name="twitter:title" content="'"$PAGE_TITLE"'">\
    <meta name="twitter:description" content="'"$DESCRIPTION"'">\
    <meta name="twitter:image" content="https://www.hypoteeka.cz/images/og-image.jpg">
        }' "$FILE"
        
        # Odstranění záložního souboru
        rm "${FILE}.bak"
        
        echo "✅ SEO meta tagy byly přidány do souboru $FILE"
    else
        echo "⏩ Soubor $FILE již obsahuje SEO meta tagy, přeskakuji"
    fi
done

echo "SEO optimalizace byla dokončena! 🚀"
