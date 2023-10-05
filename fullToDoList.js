/**
// @name        Full ToDo List
// @namespace   https://github.com/jerryngm/Canvas-LMS-Custom-JS
// @description dashboard full todo list
//
**/
(function () {
  'use strict';

  if (/\/$/.test(window.location.pathname)) {
    if (ENV.current_user_roles.includes('teacher')) {

      const fullTodoList = {
        assets: {
          css: 'https://cdn.datatables.net/v/dt/jszip-3.10.1/dt-1.13.6/b-2.4.2/b-html5-2.4.2/b-print-2.4.2/kt-2.10.0/sp-2.2.0/sl-1.7.0/datatables.min.css',
          datatables: 'https://cdn.datatables.net/v/dt/jszip-3.10.1/dt-1.13.6/b-2.4.2/b-html5-2.4.2/b-print-2.4.2/kt-2.10.0/sp-2.2.0/sl-1.7.0/datatables.min.js',
          moment: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js'
        },
        // *.instructure.com/graphiql
        queries: {
          assignments: `{
            allCourses {
              name
              _id
              submissionsConnection(filter: {states: submitted}) {
                nodes {
                  gradingStatus
                  submissionStatus
                  submittedAt
                  state
                  assignment {
                    _id
                    name
                  }
                  user {
                    _id
                    name
                    sisId
                    email
                    enrollments {
                      state
                      course {
                        _id
                      }
                    }
                  }
                }
              }
              term {
                sisTermId
                name
              }
            }
          }`,
          quizzes: `{
            allCourses {
              name
              _id
              submissionsConnection(filter: {states: pending_review}) {
                nodes {
                  gradingStatus
                  submissionStatus
                  submittedAt
                  state
                  assignment {
                    _id
                    name
                  }
                  user {
                    _id
                    name
                    sisId
                    email
                    enrollments {
                      state
                      course {
                        _id
                      }
                    }
                  }
                }
              }
              term {
                sisTermId
                name
              }
            }
          }`
        }
      };

// move to getScript for datatable js
//      var checkExist = setInterval(function () {
//        if (!document.getElementById('todoshortcut')) {
//          var html = '<button type="button" class="Button Button--primary" id="todoshortcut"><i class="icon-not-graded" aria-hidden="true"></i>Pending Marking</button>'
//          $('.todo-list-header').after(html);
//          document.getElementById('todoshortcut').addEventListener("click", opentodo);
//          clearInterval(checkExist);
//        }
//      }, 500);

      $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', fullTodoList.assets.css));

      $.getScript(fullTodoList.assets.moment, function (_d, _t, _x) {
        console.log("MomentJS loaded");
      });

      $.getScript(fullTodoList.assets.datatables, function (_d, _t, _x) {
        console.log("DataTables loaded");
	 var checkExist = setInterval(function () {
	      if (!document.getElementById('todoshortcut')) {
          var html = '<button type="button" class="Button Button--primary" id="todoshortcut"><i class="icon-not-graded" aria-hidden="true"></i>Pending Marking</button>'
          $('.todo-list-header').after(html);
          document.getElementById('todoshortcut').addEventListener("click", opentodo);
          clearInterval(checkExist);
        	}
      	}, 500);
        // move this to opentodo() before refresh, allow refresh from Pending Markings
        //CreateTodoListTable();
      });

      function opentodo() {
        var html = `<div id="tododialog" title="Pending Marking">
          <div id="msg_todolist">
            <p><strong>To Do list is loading. Please wait! <i class="icon-progress" aria-hidden="true"></i></strong></p>
          </div><button type="button" class="Button Button--secondary" id="btn_refreshToDo"><i class="icon-solid icon-refresh"
              aria-hidden="true"></i> Refresh ungraded list</button>
          <table id="todolist" class="table table-bordered" style="width:100%" cellspacing="0">
            <thead></thead>
          </table>
        </div>`;
        $('.ic-app').after(html);
        CreateTodoListTable();
        refreshToDoList();
        document.querySelector('#btn_refreshToDo').addEventListener("click", refreshToDoList);
        document.querySelector('#btn_refreshToDo').style.display = 'none';
        (function () {
          $('#tododialog').dialog({
            width: $(window).width(),
            height: $(window).height(),
            close: function (_e, _ui) {
              closetodo();
            }
          })
        }());
      }

      function closetodo() {
        $('#todolist').DataTable().clear().destroy();
        $('#todolist').find('tr').remove();
        $('#msg_todolist').remove();
        $('#btn_refreshToDo').remove();
        $('#todolist').remove();
      }

      function refreshToDoList() {
       //console.log("ToDo List Refreshed");
        if ($.fn.DataTable.isDataTable('#todolist')) {
          $('#todolist').DataTable().clear().destroy();
          $('#todolist').find('tr').remove();
          CreateTodoListTable();
          document.getElementById("msg_todolist").style.display = 'block';
          document.querySelector('#btn_refreshToDo').style.display = 'none';
        }
      }

      function GetTodoList(query) {
        var tdlist_filtered

        return new Promise((resolve, _reject) => {
          // Simulate an asynchronous operation
          setTimeout(() => {
            $.ajax({
              url: '/api/graphql',
              type: 'POST',
              data: {
                query: 'query ' + query
              },
              beforeSend: function (_xhr) {},
              success: function (result, _status, _xhr) {
                tdlist_filtered = result.data.allCourses.filter(d => d.submissionsConnection.nodes.length !== 0);
                resolve(CreateTodoListArray(tdlist_filtered));
              },
              error: function (e) {
                console.log(e);
              },
            });

          }, 500);
        });
      }

      function CreateTodoListArray(data) {

        //console.log(data)
        //var requests = 0;
        var todolist = [];
        var classlist = 0;
        var submissionlist = 0;
        var enrolmentlist = 0;
        var canvas_url = window.location.origin;
        for (classlist = 0; classlist < data.length; classlist++) {
          //console.log('length of classlist', data.length)
          //console.log('current class', classlist)
          submissionlist = 0;
          for (submissionlist = 0; submissionlist < data[classlist].submissionsConnection.nodes.length; submissionlist++) {
            //console.log('length of node', data[classlist].submissionsConnection.nodes.length)
            //console.log('current submission', submissionlist)
            for (enrolmentlist = 0; enrolmentlist < data[classlist].submissionsConnection.nodes[submissionlist].user.enrollments.length; enrolmentlist++) {
              if (data[classlist].submissionsConnection.nodes[submissionlist].user.enrollments[enrolmentlist].course._id == data[classlist]._id && data[classlist].submissionsConnection.nodes[submissionlist].user.enrollments[enrolmentlist].state == 'active' && data[classlist].submissionsConnection.nodes[submissionlist].user.name !== 'Test Student' && /Demo\b/.test(data[classlist].name) == false) {
                todolist.push({
                  coursename: data[classlist].name,
                  stdname: data[classlist].submissionsConnection.nodes[submissionlist].user.name,
                  sisid: data[classlist].submissionsConnection.nodes[submissionlist].user.sisId,
                  stdemail: data[classlist].submissionsConnection.nodes[submissionlist].user.email,
                  assname: data[classlist].submissionsConnection.nodes[submissionlist].assignment.name,
                  submittedat: data[classlist].submissionsConnection.nodes[submissionlist].submittedAt,
                  daysince: moment().diff(data[classlist].submissionsConnection.nodes[submissionlist].submittedAt, 'days'),
                  speedgrader: canvas_url + '/courses/' + data[classlist]._id + '/gradebook/speed_grader?assignment_id=' + data[classlist].submissionsConnection.nodes[submissionlist].assignment._id + '&student_id=' + data[classlist].submissionsConnection.nodes[submissionlist].user._id,
                  term: data[classlist].term.name
                })
              }
            }
          }
        }
        return todolist;
      }

      async function CreateTodoListTable() {

        const [quiz, assignment] = await Promise.all([GetTodoList(fullTodoList.queries.quizzes), GetTodoList(fullTodoList.queries.assignments)]);

        //console.log(quiz);
        //console.log(assignment);
        var combinedArray = quiz.concat(assignment);
        var table;

        if(document.getElementById("msg_todolist")) {
          document.getElementById("msg_todolist").style.display = 'none';
        }
        document.querySelector('#btn_refreshToDo').style.display = 'block';

        setHeader();

        function setHeader() {
          var $tr = $('<tr>');
          $tr.append($('<th>').text("Course Name"));
	  $tr.append($('<th>').text("Term"));
          $tr.append($('<th>').text("Student Name"));
          $tr.append($('<th>').text("Student ID"));
          $tr.append($('<th>').text("Student Email"));
          $tr.append($('<th>').text("Assignment Name"));
          $tr.append($('<th>').text("Submitted At"));
          $tr.append($('<th>').text("Day Since Submitted"));
          $tr.append($('<th>').text("SpeedGrader Link"));
          $tr.appendTo('#todolist thead');
        }

        table = $('#todolist').DataTable({
          data: combinedArray,
          "lengthMenu": [20, 50, 100],
          "ordering": true,
          "order": [
            [7, "desc"]
          ],
          "processing": true,
          destroy: true,
//Change column visibility here\\
			"columns": [{
              data: "coursename",
			        visible: true
            },
            {
              data: "term",
			        visible: true
            },
            {
              data: "stdname",
			        visible: true
            },
            {
              data: "sisid",
              visible: true
            },
            {
              data: "stdemail",
              visible: false
            },
            {
              data: "assname",
			        visible: true
            },
            {
              data: "submittedat",
			        visible: true
            },
            {
              data: "daysince",
			        visible: true
            },
            {
              data: "speedgrader",
			        visible: true
            }
          ],
          keys: true,
          dom: 'iPlfrtip',
          searchPanes: {
            cascadePanes: true,
            columns: [0]
          },
          "columnDefs": [{
              targets: [6],
              data: "submittedat",
              render: function (data, _type, _row, _meta) {
                moment.updateLocale(moment.locale(), {
                  invalidDate: ""
                });
                return moment(data).format('DD/MM/YYYY HH:MM');
              }
            },
            {
              targets: 8,
              render: function (data, _type, _row, _meta) {
                return `<a href="${data}" target="_blank">Go to <i class="icon-line icon-speed-grader" aria-hidden="true"></i></a>`;
              }
            }
          ],
          buttons: [{
              extend: 'excelHtml5',
              filename: 'Canvas_Ungraded_Report_' + moment().format('DDMMYYYY'),
              title: '',
              autoFilter: true
            },
            {
              extend: 'copyHtml5',
            },
            {
              extend: 'print'
            }
          ]
        });
        table.buttons().container().insertAfter('#todolist_length');
      };
    }
  }
})();
