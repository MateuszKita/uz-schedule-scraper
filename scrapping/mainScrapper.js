const request = require('request')
const cheerio = require('cheerio')
const async = require('async')

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

        studyCourses.forEach(studyCourse => {
            request(studyCourse.url, (er, res) => {
                const $ = cheerio.load(res.body)
                $('tbody tr td a').each((index, el) => {
                    studyCourse.groups.push(
                        {
                            id: index,
                            name: el.children[0].data,
                            url: uzUrlPrefix + el.attribs.href
                        }
                    )
                })
                console.log(studyCourse)
            })
        })

    }
    else {
        console.log(res.statusCode, er)
    }
})


const mainScrapper = (mainUrl) => {
    async.waterfall(cb => {

    })
}

module.exports = {
    mainScrapper: mainScrapper
}