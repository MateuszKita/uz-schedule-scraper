const request = require("request");
const cheerio = require("cheerio");
const async = require("async");

const uzUrlPrefix = "http://www.plan.uz.zgora.pl/";

const mainScraper = mainUrl => {
  async.waterfall([
    cb => {
      let studyCourses = [];
      console.log("[1st request] Calling MainUrl");
      request(mainUrl, (er, res) => {
        if (!er && res.statusCode == "200") {
          const $ = cheerio.load(res.body);

          $(".list-group-item li a").each((index, el) => {
            studyCourses.push({
              id: index,
              url: uzUrlPrefix + el.attribs.href,
              name: el.children[0].data,
              groups: []
            });
          });
        } else {
          console.log("[1st request ERROR:]", res.statusCode, er);
        }

        console.log("[1st request] OK");
        cb(null, studyCourses);
      });
    },
    (studyCourses, cb) => {
      console.log("[2nd request] Calling studyCourses URLs");
      let studyCoursesWithGroups = [];

      studyCourses.map(studyCourse => {
        request(studyCourse.url, (er, res) => {
          if (er) {
            console.log(studyCourse.id + " studyCourses ERROR:", er);
          } else {
            const $ = cheerio.load(res.body);
            $("tbody tr td a").each((index, el) => {
              studyCourse.groups.push({
                id: index,
                name: el.children[0].data,
                url: uzUrlPrefix + el.attribs.href
              });
            });
          }

          studyCoursesWithGroups.push(studyCourse);

          if (studyCoursesWithGroups.length == studyCourses.length) {
            console.log("[2nd request] OK");
            cb(null, studyCoursesWithGroups);
          }
        });
      });
    },
    (studyCoursesWithGroups, cb) => {
      console.log("[3rd request]");
      studyCoursesWithGroups.forEach(studyCourseGroup => {
        studyCourseGroup.groups.forEach(group => {
          request(group.url, (er, res) => {
            if (!er && res.statusCode == "200") {
              const $ = cheerio.load(res.body);

              $(".list-group-item li a").each((index, el) => {
                studyCourses.push({
                  id: index,
                  url: uzUrlPrefix + el.attribs.href,
                  name: el.children[0].data,
                  groups: []
                });
              });
            } else {
              console.log("[3rd request ERROR:]", res.statusCode, er);
            }
            console.log("[3rd request] OK");
            cb(null, studyCourses);
          });
        });
      });
    }
  ]);
};

module.exports = {
  mainScraper: mainScraper
};
