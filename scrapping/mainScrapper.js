const request = require('request')
const cheerio = require('cheerio')

const mainWebsiteUrl = 'http://www.plan.uz.zgora.pl/grupy_lista_kierunkow.php'
const uzUrlPrefix = 'http://www.plan.uz.zgora.pl/'

request(mainWebsiteUrl, (er, res) => {
    if (!er && res.statusCode == "200") {
        const $ = cheerio.load(res.body)

        let studyCourses = []
        $('.list-group-item li a').each((index, el) => {
            studyCourses.push({
                id: index,
                url: uzUrlPrefix + el.attribs.href,
                name: el.children[0].data,
                groups: []
            })
        })
        console.log(studyCourses[0])

        studyCourses.forEach(studyCourse => {
            request(studyCourses[0], (er, res) => {
                const $ = cheerio.load(res.body)
                $('tbody tr td a').each((index, el) => {
                    studyCourse.
                })
                console.log(tu)
            })
        })
    }
    else {
        console.log(res.statusCode, er)
    }
})