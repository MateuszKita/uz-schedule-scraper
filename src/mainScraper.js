const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const tabletojson = require('tabletojson');


const WJF = require('./writeJsonFile');

const uzUrlPrefix = 'http://www.plan.uz.zgora.pl/';

const mainScraper = mainUrl => {
  async.waterfall([
    cb => {
      let faculties = [];
      let courses = [];

      console.log('[1st request] Calling MainUrl');
      request(mainUrl, (er, res) => {
        if (!er && res.statusCode == '200') {
          const $ = cheerio.load(res.body);
          $('li .list-group').each((index, el) => {
            if (faculties.length === 0) {
              faculties.push({
                id: index,
                name: el.prev.data.trim(),
                courses: []
              });
            } else if (
              faculties[faculties.length - 1].name !== el.prev.data.trim()
            ) {
              faculties.push({
                id: index,
                name: el.prev.data.trim(),
                courses: []
              });
            }
          });
          $('.list-group-item li a').each((index, el) => {
            // if (faculty.name === el.parent.prev.parent.prev.data.trim()) {
            courses.push({
              id: index,
              url: uzUrlPrefix + el.attribs.href,
              name: el.children[0].data !== undefined ?
                el.children[0].data : 'undefined',
              groups: [],
              faculty: el.parent.prev.parent.prev.data.trim()
            });
            // if (index == 0) {
            //   console.log(el.parent.prev.parent.prev.data.trim());
            // }
          });
        } else {
          console.log('[1st request ERROR:]', res.statusCode, er);
        }

        faculties.map(faculty => {
          courses.map(course => {
            if (faculty.name === course.faculty) {
              delete course.faculty;
              faculty.courses.push(course);
            }
          });
        });

        console.log('[1st request] OK');
        cb(null, faculties);
      });
    },
    (facultiesWithCourses, cb) => {
      console.log('[2nd request] Calling studyCourses URLs');
      // let facultiesWithCoursesAndGroups = [];
      let amountOfCourses = 0;
      let counter = 0;

      facultiesWithCourses.forEach(faculty => {
        faculty.courses.forEach(course => {
          amountOfCourses++;
        });
      });

      facultiesWithCourses.map(faculty => {
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
            // facultiesWithCoursesAndGroups.push(faculty);
            counter++;
            if (counter === amountOfCourses) {
              console.log('[2nd request] OK');
              cb(null, facultiesWithCourses);
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
      let test = [];
      facultiesWithCoursesAndGroups.map(facultysWithCoursesAndGroups => {
        facultysWithCoursesAndGroups.courses.map(course => {
          course.groups.map(group => {
            group.schedule = {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
              sunday: [],
              irregular: [],
              other: []
            };
            time += 100;
            setTimeout(() => {
              request(group.url, (er, res) => {
                const $ = cheerio.load(res.body);

                let i = tabletojson.convert(res.body)[0]

                if (i && i.length > 0) {
                  i.map((el, index) => {
                    if (el.PG === '') {
                      if (i[index - 1].PG !== '') {
                        el.PG = i[index - 1].PG
                      } else if (i[index - 2].PG !== '') {
                        el.PG = i[index - 2].PG
                      } else if (i[index - 3].PG !== '') {
                        el.PG = i[index - 3].PG
                      } else if (i[index - 4].PG !== '') {
                        el.PG = i[index - 4].PG
                      } else if (i[index - 5].PG !== '') {
                        el.PG = i[index - 5].PG
                      } else if (i[index - 6].PG !== '') {
                        el.PG = i[index - 6].PG
                      } else if (i[index - 7].PG !== '') {
                        el.PG = i[index - 7].PG
                      } else {
                        el.PG = ''
                      }
                    }
                  })

                  i.map((el, index) => {
                    if (Object.keys(el).length === 1) {
                      i.splice(index, 1)
                    }
                  })

                  i.forEach(el => {
                    if (el.PG === 'Poniedziałek') {
                      group.schedule.monday.push(el)
                    } else if (el.PG === 'Wtorek') {
                      group.schedule.tuesday.push(el)
                    } else if (el.PG === 'Środa') {
                      group.schedule.wednesday.push(el)
                    } else if (el.PG === 'Czwartek') {
                      group.schedule.thursday.push(el)
                    } else if (el.PG === 'Piątek') {
                      group.schedule.friday.push(el)
                    } else if (el.PG === 'Piątek') {
                      group.schedule.saturday.push(el)
                    } else if (el.PG === 'Sobota') {
                      group.schedule.sunday.push(el)
                    } else if (el.PG === 'Nieregularne') {
                      group.schedule.irregular.push(el)
                    } else {
                      group.schedule.other.push(el)
                    }
                  })
                }

                processCounter++;
                if (!er) {
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