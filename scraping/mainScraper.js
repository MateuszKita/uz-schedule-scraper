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
      console.log("[3rd request] Calling study courses groups' URLs");
      let studyCoursesWithGroupsAmount = 0;
      let newStudyCoursesWithGroupsAmount = 0;
      studyCoursesWithGroups.forEach(studyCoursesWithGroup => {
        studyCoursesWithGroupsAmount += studyCoursesWithGroup.groups.length;
      });

      let newStudyCoursesWithGroups = [];
      studyCoursesWithGroups.map(studyCourseWithGroups => {
        studyCourseWithGroups.groups.map(group => {
          request(group.url, (er, res) => {
            if (res.statusCode) {
              if (!er && res.statusCode == "200") {
                // const $ = cheerio.load(res.body);
                // $(".list-group-item li a").each((index, el) => {
                //   studyCourses.push({
                //     id: index,
                //     url: uzUrlPrefix + el.attribs.href,
                //     name: el.children[0].data,
                //     groups: []
                //   });
                // });
                newStudyCoursesWithGroups.push(studyCourseWithGroups);
              } else {
                console.log("[3rd request] ERROR: ", res.statusCode, er);
              }
              newStudyCoursesWithGroupsAmount++;
              if (
                studyCoursesWithGroupsAmount == newStudyCoursesWithGroupsAmount
              ) {
                console.log("[3rd request] OK");
                cb(null, newStudyCoursesWithGroups);
              }
            }
          });
        });
      });
    },
    (studyCoursesWithGroupsPlans, cb) => {
      console.log("[4rd request]");
      studyCoursesWithGroupsPlans = studyCoursesWithGroupsPlans.sort(
        (course, another) => {
          if (course.id < another.id) return -1;
          if (course.id > another.id) return 1;
          return 0;
        }
      );
      console.log(studyCoursesWithGroupsPlans[0]);
      console.log(studyCoursesWithGroupsPlans[1]);
      console.log(studyCoursesWithGroupsPlans[2]);
    }
  ]);
};

module.exports = {
  mainScraper: mainScraper
};
