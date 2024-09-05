/**
// @Name        Full ToDo List
// @namespace   https://github.com/jerryngm/Canvas-LMS-Custom-JS
// @description dashboard full todo list
// @version	3.0
// @date	2024-09-05
**/
(function() {
	'use strict';
	var enrollment_list
	if (/\/$/.test(window.location.pathname)) {
		if (ENV.current_user_roles.includes('teacher')) {

			const fullTodoList = {
				assets: {
					css: 'https://cdn.datatables.net/v/dt/jszip-3.10.1/dt-2.1.5/b-3.1.2/b-colvis-3.1.2/b-html5-3.1.2/b-print-3.1.2/cr-2.0.4/fh-4.0.1/kt-2.12.1/r-3.0.3/sb-1.8.0/sp-2.3.2/sl-2.0.5/sr-1.4.1/datatables.min.css',
					datatables: 'https://cdn.datatables.net/v/dt/jszip-3.10.1/dt-2.1.5/b-3.1.2/b-colvis-3.1.2/b-html5-3.1.2/b-print-3.1.2/cr-2.0.4/fh-4.0.1/kt-2.12.1/r-3.0.3/sb-1.8.0/sp-2.3.2/sl-2.0.5/sr-1.4.1/datatables.min.js',
					moment: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js'
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

			var checkExist = setInterval(function() {
				if (!document.getElementById('todoshortcut')) {
					var html = '<button type="button" class="Button Button--primary" id="todoshortcut"><i class="icon-not-graded" aria-hidden="true"></i>Pending Marking</button>'
					$('.todo-list-header').after(html);
					document.getElementById('todoshortcut').addEventListener("click", opentodo);
					clearInterval(checkExist);
				}
			}, 500);

			$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', fullTodoList.assets.css));

			$.getScript(fullTodoList.assets.moment, function(_d, _t, _x) {
				console.log("MomentJS loaded");
			});

			$.getScript(fullTodoList.assets.datatables, function(_d, _t, _x) {
				console.log("DataTables loaded");
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
				(function() {
					$('#tododialog').dialog({
						width: $(window).width(),
						height: $(window).height(),
						close: function(_e, _ui) {
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
							beforeSend: function(_xhr) {},
							success: function(result, _status, _xhr) {
								tdlist_filtered = result.data.allCourses.filter(d => d.submissionsConnection.nodes.length !== 0);
								resolve(CreateTodoListArray(tdlist_filtered));
							},
							error: function(e) {
								console.log(e);
							},
						});

					}, 500);
				});
			}


			function GetEnrollment() {
				return new Promise((resolve, reject) => {
					enrollment_list = []; // Initialize the enrollment list to store all pages of enrollment data

					function fetchEnrollments(url) {
						$.ajax({
							url: url,
							type: 'GET',
							success: function(result, _status, xhr) {
								enrollment_list = enrollment_list.concat(result); // Add current page's results to the enrollment list

								// Get pagination link from the header
								const linkHeader = xhr.getResponseHeader('Link');
								const nextLink = getNextLinkFromHeader(linkHeader);

								if (nextLink) {
									fetchEnrollments(nextLink); // Fetch the next page if it exists
								} else {
									resolve(enrollment_list); // Resolve once all pages have been fetched
								}
							},
							error: function(e) {
								console.log(e);
								reject(e); // Reject if an error occurs
							}
						});
					}

					// Start fetching from the initial URL
					fetchEnrollments('/api/v1/users/self/enrollments');

					// Helper function to extract the "next" link from the pagination header
					function getNextLinkFromHeader(linkHeader) {
						if (!linkHeader) return null;

						const links = linkHeader.split(',');
						for (let i = 0; i < links.length; i++) {
							const parts = links[i].split(';');
							const url = parts[0].replace(/[<>]/g, '').trim();
							const rel = parts[1].trim();

							if (rel === 'rel="next"') {
								return url; // Return the next page's URL
							}
						}
						return null;
					}
				});
			}



			function CreateTodoListArray(data) {

				console.log(data)
				console.log(enrollment_list)
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


								var matching_enrolment = enrollment_list.find(e =>
									e.course_id == data[classlist]._id
								);

								// Add the role and enrollment_state from the matching enrolment data
								var role = matching_enrolment ? matching_enrolment.type : null;
								var enrollment_state = matching_enrolment ? matching_enrolment.enrollment_state : null;


								todolist.push({
									coursename: data[classlist].name,
									stdname: data[classlist].submissionsConnection.nodes[submissionlist].user.name,
									sisid: data[classlist].submissionsConnection.nodes[submissionlist].user.sisId,
									stdemail: data[classlist].submissionsConnection.nodes[submissionlist].user.email,
									assname: data[classlist].submissionsConnection.nodes[submissionlist].assignment.name,
									submittedat: data[classlist].submissionsConnection.nodes[submissionlist].submittedAt,
									daysince: moment().diff(data[classlist].submissionsConnection.nodes[submissionlist].submittedAt, 'days'),
									speedgrader: canvas_url + '/courses/' + data[classlist]._id + '/gradebook/speed_grader?assignment_id=' + data[classlist].submissionsConnection.nodes[submissionlist].assignment._id + '&student_id=' + data[classlist].submissionsConnection.nodes[submissionlist].user._id,
									term: data[classlist].term.name,
									role: role,
									enrollment_state: enrollment_state
								})
							}
						}
					}
				}
				return todolist;
			}



			async function CreateTodoListTable() {
				// Try running these asynchronous functions
				const enrollment = await GetEnrollment(); // Await for enrollment data to be fetched
				const [quiz, assignment] = await Promise.all([
					GetTodoList(fullTodoList.queries.quizzes),
					GetTodoList(fullTodoList.queries.assignments)
				]);

				//console.log(enrollment); // You can now access the enrollment data here
				// Continue with the rest of the code

				//console.log(quiz);
				//console.log(assignment);
				var combinedArray = quiz.concat(assignment);
				var table;

				if (document.getElementById("msg_todolist")) {
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
					$tr.append($('<th>').text("Role"));
					$tr.append($('<th>').text("Enrolment State"));
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
					colReorder: true,
					responsive: true,
					stateSave: true,
					//Change column visibility here
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
							visible: true,
							className: 'speedgrader-link'
						},
						{
							data: "role",
							visible: true
						},
						{
							data: "enrollment_state",
							visible: true
						}
					],
					keys: true,
					dom: 'iPlfrQBtip',
					searchPanes: {
						cascadePanes: true,
						columns: [0]
					},
					"columnDefs": [{
							targets: [6],
							data: "submittedat",
							render: function(data, _type, _row, _meta) {
								moment.updateLocale(moment.locale(), {
									invalidDate: ""
								});
								return moment(data).format('DD/MM/YYYY HH:mm');
							}
						},
						{
							targets: 8,
							render: function(data, _type, _row, _meta) {
								return `<a href="${data}" target="_blank">Go to <i class="icon-line icon-speed-grader" aria-hidden="true"></i></a>`;
							}
						}
					],
					buttons: [{
							extend: 'excelHtml5',
							filename: 'Canvas_Ungraded_Report_' + moment().format('YYYY-MM-DD'),
							title: '',
							autoFilter: true,
							exportOptions: {
								columns: ':visible',
								format: {
									body: function(data, row, column, node) {
										if ($(node).hasClass('speedgrader-link')) {
											// Return only the URL
											return $(node).find('a').attr('href') || data;
										}
										return data;
									}
								}
							}
						},
						{
							extend: 'copyHtml5',
							title: '',
							exportOptions: {
								columns: ':visible',
								format: {
									body: function(data, row, column, node) {
										if ($(node).hasClass('speedgrader-link')) {
											// Return only the URL
											return $(node).find('a').attr('href') || data;
										}
										return data;
									}
								}
							}
						},
						{
							extend: 'print',
							title: 'Ungraded Submission as of ' + moment().format('YYYY-MM-DD'),
							exportOptions: {
								columns: ':visible',
								format: {
									body: function(data, row, column, node) {
										if ($(node).hasClass('speedgrader-link')) {
											// Return only the URL
											return $(node).find('a').attr('href') || data;
										}
										return data;
									}
								}
							}
						},
						{
							extend: 'colvis'
						}
					],
					searchBuilder: {
						preDefined: {
							criteria: [{
								condition: '=',
								data: 'Role',
								value: ['TeacherEnrollment']
							}, {
								condition: '=',
								data: 'Role',
								value: ['TaEnrollment']
							}, ],
							logic: 'OR'
						}

					}
				});

			};
		}
	}
})();
