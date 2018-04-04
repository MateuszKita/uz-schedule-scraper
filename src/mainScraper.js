const request = require('request');
const cheerio = require('cheerio');
const async = require('async');

const WJF = require('./writeJsonFile');

const uzUrlPrefix = 'http://www.plan.uz.zgora.pl/';

const mainScraper = mainUrl => {
  async.waterfall([
    cb => {
      let faculties = [];
      console.log('[1st request] Calling MainUrl');
      request(mainUrl, (er, res) => {
        if (!er && res.statusCode == '200') {
          const $ = cheerio.load(res.body);
          $('li .list-group').each((index, el) => {
            faculties.push({
              id: index,
              name: el.prev.data.trim(),
              courses: []
            });
            // console.log("'" + faculties + "'");
          });
          $('.list-group-item li a').each((index, el) => {
            faculties.map(faculty => {
              if (faculty.name === el.parent.prev.parent.prev.data.trim()) {
                faculty.courses.push({
                  id: index,
                  url: uzUrlPrefix + el.attribs.href,
                  name:
                    el.children[0].data !== undefined
                      ? el.children[0].data
                      : 'undefined',
                  groups: []
                });
              }
            });
            // if (index == 0) {
            //   console.log(el.parent.prev.parent.prev.data.trim());
            // }
          });
        } else {
          console.log('[1st request ERROR:]', res.statusCode, er);
        }

        console.log('[1st request] OK');
        cb(null, faculties);
      });
    },
    (faculties, cb) => {
      console.log('[2nd request] Calling studyCourses URLs');
      let facultiesWithCoursesAndGroups = [];
      let amountOfCourses = 0;
      faculties.forEach(faculty => {
        faculty.courses.forEach(course => {
          amountOfCourses++;
        });
      });

      faculties.map(faculty => {
        faculty.courses.map(studyCourse => {
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
            facultiesWithCoursesAndGroups.push(faculty);

            if (facultiesWithCoursesAndGroups.length == amountOfCourses) {
              console.log('[2nd request] OK');
              cb(null, facultiesWithCoursesAndGroups);
            }
          });
        });
      });
    },
    (facultiesWithCoursesAndGroups, cb) => {
      console.log(
        "[3rd request] Calling study courses groups' URLs with schedules"
      );

      facultiesWithCoursesAndGroups = facultiesWithCoursesAndGroups.sort(
        (course, another) => {
          if (course.id < another.id) return -1;
          if (course.id > another.id) return 1;
          return 0;
        }
      );

      let groupsUrlsAmount = 0;
      let processCounter = 0;

      facultiesWithCoursesAndGroups.forEach(facultysWithCoursesAndGroups => {
        facultysWithCoursesAndGroups.courses.forEach(course => {
          groupsUrlsAmount += course.groups.length;
        });
      });

      let time = 0;
      facultiesWithCoursesAndGroups.map(facultysWithCoursesAndGroups => {
        facultysWithCoursesAndGroups.courses.map(course => {
          course.groups.map(group => {
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
                    cb(null, facultiesWithCoursesAndGroups);
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
            }, 2500 + time);
          });
        });
      });
    },
    (facultiesWithCoursesAndGroups, cb) => {
      console.log('[4rd request]');
      facultiesWithCoursesAndGroups = facultiesWithCoursesAndGroups.sort(
        (course, another) => {
          if (course.id < another.id) return -1;
          if (course.id > another.id) return 1;
          return 0;
        }
      );
      WJF.writeToFile(facultiesWithCoursesAndGroups);
    }
  ]);
};

module.exports = {
  mainScraper: mainScraper
};
