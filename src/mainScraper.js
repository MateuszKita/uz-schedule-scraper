const request = require('request');
const cheerio = require('cheerio');
const async = require('async');

const uzUrlPrefix = 'http://www.plan.uz.zgora.pl/';

const mainScraper = mainUrl => {
  async.waterfall([
    cb => {
      let studyCourses = [];
      console.log('[1st request] Calling MainUrl');
      request(mainUrl, (er, res) => {
        if (!er && res.statusCode == '200') {
          const $ = cheerio.load(res.body);

          $('.list-group-item li a').each((index, el) => {
            studyCourses.push({
              id: index,
              url: uzUrlPrefix + el.attribs.href,
              name: el.children[0].data,
              groups: []
            });
          });
        } else {
          console.log('[1st request ERROR:]', res.statusCode, er);
        }

        console.log('[1st request] OK');
        cb(null, studyCourses);
      });
    },
    (studyCourses, cb) => {
      console.log('[2nd request] Calling studyCourses URLs');
      let studyCoursesWithGroups = [];

      studyCourses.map(studyCourse => {
        request(studyCourse.url, (er, res) => {
          if (er) {
            console.log(studyCourse.id + ' studyCourses ERROR:', er);
          } else {
            const $ = cheerio.load(res.body);

            $('tbody tr td a').each((index, el) => {
              studyCourse.groups.push({
                id: index,
                name: el.children[0].data,
                url: uzUrlPrefix + el.attribs.href
              });
            });
          }

          studyCoursesWithGroups.push(studyCourse);

          if (studyCoursesWithGroups.length == studyCourses.length) {
            console.log('[2nd request] OK');
            cb(null, studyCoursesWithGroups);
          }
        });
      });
    },
    (studyCoursesWithGroups, cb) => {
      console.log(
        "[3rd request] Calling study courses groups' URLs with schedules"
      );
      studyCoursesWithGroups = studyCoursesWithGroups.sort(
        (course, another) => {
          if (course.id < another.id) return -1;
          if (course.id > another.id) return 1;
          return 0;
        }
      );
      let groupsUrlsAmount = 0;
      let processCounter = 0;

      studyCoursesWithGroups.forEach(studyCoursesWithGroup => {
        groupsUrlsAmount += studyCoursesWithGroup.groups.length;
      });
      let time = 0;
      studyCoursesWithGroups.map(studyCourseWithGroups => {
        studyCourseWithGroups.groups.map(group => {
          time += 100;
          setTimeout(() => {
            request(group.url, (er, res) => {
              group.schedule = {
                monday: {},
                tuesday: {},
                wednesday: {},
                thursday: {},
                friday: {}
              };
              processCounter++;
              if (!er) {
                // const $ = cheerio.load(res.body);
                // $(".list-group-item li a").each((index, el) => {
                //   studyCourses.push({
                //     id: index,
                //     url: uzUrlPrefix + el.attribs.href,
                //     name: el.children[0].data,
                //     groups: []
                //   });
                // });
                if (processCounter == groupsUrlsAmount) {
                  console.log('[3rd request] OK');
                  cb(null, studyCoursesWithGroups);
                } else {
                  console.log(
                    'Processing: ' +
                      (processCounter / groupsUrlsAmount * 100).toFixed(2) +
                      '%'
                  );
                }
              } else {
                console.log('[3rd request] ERROR: ' + er);
              }
            });
          }, 3000 + time);
        });
      });
    },
    (studyCoursesWithGroupsPlans, cb) => {
      console.log('[4rd request]');
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
