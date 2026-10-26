# VAT: kraj odbiorcy a podatek pobierany przez sklep

Sprawdzone 2026-10-26. Stawki podstawowe ponizej nie sa instrukcja naliczania ich w koszyku. Klasyfikacja konkretnych towarow, rejestracje sprzedawcy, progi i sposob importu wymagaja potwierdzenia przez ksiegowosc.

W `src/lib/checkout.ts` wartosci 0 oznaczaja obecnie brak VAT pobieranego przez sklep przy eksporcie z Niemiec. Nie oznaczaja, ze kraj odbiorcy nie ma VAT. Nie zmieniono wyliczen na podstawie samego lokalnego procentu.

## Kraje z wartoscia 0 w aplikacji

| Kod | Kraj | Lokalna stawka podstawowa / status | Zrodlo |
| --- | --- | --- | --- |
| CH | Szwajcaria | 8,1% | [Urzad celny](https://www.bazg.admin.ch/en/courier-by-post-online-shopping-mail-order-importation-companies) |
| LI | Liechtenstein | 8,1% | [Administracja podatkowa](https://www.llv.li/en/business/tax-duties-insurance/value-added-tax/vat-rates) |
| MK | Macedonia Polnocna | 18% | [Administracja podatkowa](https://www.ujp.gov.mk/mk/vodic/category/949?print=1) |
| AL | Albania | 20% | [Administracja podatkowa](https://www.tatime.gov.al/eng/d/8/45/0/417/guideline-for-small-business-in-vat-where-to-be-careful) |
| AD | Andora | 4,5% IGI | [Rzad Andory](https://www.e-tramits.ad/tramits/impostos/igi) |
| BA | Bosnia i Hercegowina | 17% | [Administracja podatkowa](https://www.uino.gov.ba/portal/en/vat/general-information-on-vat-system-in-bosnia-and-herzegovina/) |
| ME | Czarnogora | 21% | [Rzad Czarnogory](https://www.gov.me/clanak/porez-na-dodatu-vrijednost) |
| IS | Islandia | 24% | [Portal rzadowy](https://island.is/en/taxes-on-goods-and-services) |
| XK | Kosowo | 18% | [Administracja podatkowa](https://www.atk-ks.org/en/notice-to-taxpayers-apply-the-vat-rate-correctly-4/) |
| MD | Moldawia | 20% | [Administracja podatkowa, art. 96](https://www.sfs.md/ru/voprosy-bazy-dannyh-obobshcheniya/9) |
| NO | Norwegia | 25% | [Administracja podatkowa](https://www.skatteetaten.no/satser/merverdiavgift/) |
| SM | San Marino | Brak klasycznego VAT; zasadniczo 17% podatku importowego monofase | [Agencja rozwoju / izba gospodarcza](https://www.camcom.sm/en/doing-business-in-san-marino-2/favourable-taxation/) |
| RS | Serbia | 20% | [Agencja rozwoju Serbii](https://www.ras.gov.rs/en/invest-in-serbia/why-serbia/competitive-operating-costs) |
| TR | Turcja | 20% | [Administracja podatkowa, aktualne stawki](https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fyardim-kaynaklar%2Fyararli-bilgiler%2Fkdv-oranlari.pdf) |
| UA | Ukraina | 20% | [Kodeks podatkowy, art. 193-194](https://www.tax.gov.ua/nk/rozdil-v--podatok-na-dodanu-vartist/) |
| VA | Watykan | Nie potwierdzono lokalnej stawki podstawowej w aktualnym zrodle urzedowym; nie traktowac wartosci 0 w kodzie jako potwierdzenia jej braku | [Komisja Europejska: poza obszarem unijnego VAT](https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/how-does-vat-work/territorial-scope_en) |
| AE | Zjednoczone Emiraty Arabskie | 5% | [Ministerstwo Finansow](https://mof.gov.ae/en/public-finance/tax/value-added-tax-vat/) |
| QA | Katar | VAT nie zostal wdrozony; to nie jest stawka zerowa | [Administracja podatkowa](https://gta.gov.qa/ar/investors-guide) |

## Co wymaga ustalenia przed uruchomieniem sprzedazy

- Eksport z UE moze korzystac ze zwolnienia z prawem do odliczenia; sprzedawca musi posiadac dokumentacje wywozu. [Komisja Europejska](https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/indexamp_en.htm).
- Szwajcaria/Liechtenstein: sposob pobierania podatku zalezy m.in. od rejestracji sprzedawcy i regul wysylkowych; nieprawidlowe oznaczenie przesylki moze prowadzic do podwojnego obciazenia klienta. [FTA](https://www.estv.admin.ch/en/vat-mail-order-trade-and-platform-taxation).
- Norwegia: VOEC obejmuje kwalifikujace sie towary o wartosci ponizej 3000 NOK za sztuke, z obowiazkiem rejestracji po przekroczeniu odpowiedniego progu obrotu. Podatek moze byc pobierany przy zakupie, a nie od odbiorcy przy imporcie. [Norweski urzad celny](https://www.toll.no/en/corporate/import/the-voec-scheme/).
- UK: wszystkie zamowienia, takze firmowe i do Irlandii Polnocnej, wylacznie przez kontakt e-mail. Formularz, API wyceny i API zamowien blokuja automatyczny zakup niezaleznie od wartosci i wagi koszyka. Nie ma automatycznego naliczania UK VAT ani pobierania kursu GBP. Zasady podatkowe nalezy ustalic przy indywidualnej obsludze zamowienia. [HMRC](https://www.gov.uk/guidance/charging-vat-on-goods-sold-direct-to-customers-in-the-uk).
- Nalezy ustalic, kto jest importerem i kto oplaca podatek/celne koszty odprawy, oraz w jakich krajach sprzedawca jest zarejestrowany lub ma obowiazek rejestracji. Nie wystarczy tabela lokalnych stawek.

Do czasu takiego potwierdzenia nie mozna uznac wszystkich zer eksportowych ani konfiguracji UK za zweryfikowany podatkowo model sprzedazy. Testy arytmetyczne potwierdzaja wylacznie zgodnosc kodu z ustalona konfiguracja.
