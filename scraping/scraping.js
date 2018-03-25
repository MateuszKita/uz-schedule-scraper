const MS = require('./mainScraper');
const fs = require('fs-extra');

const mainWebsiteUrl = 'http://www.plan.uz.zgora.pl/grupy_lista_kierunkow.php';

MS.mainScraper(mainWebsiteUrl);
