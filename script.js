// DOM 요소 가져오기
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDateDisplay = document.getElementById('selectedDateDisplay');
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const ddayModal = document.getElementById('ddayModal');
const closeButton = document.querySelector('.close-button');
const modalTaskDate = document.getElementById('modalTaskDate');
const modalTaskContent = document.getElementById('modalTaskContent');
const modalDday = document.getElementById('modalDday');

let currentDate = new Date(); // 현재 날짜 (캘린더의 기준)
let selectedDate = null; // 사용자가 선택한 날짜

// 로컬 스토리지에서 수행평가 데이터 로드 (JSON.parse 실패 시 빈 객체 반환)
// { "YYYY-MM-DD": [{id: ..., content: ...}, ...], ... }
const assignments = JSON.parse(localStorage.getItem('assignments')) || {};

// 캘린더 생성 함수
function renderCalendar() {
    calendarGrid.innerHTML = `
        <div class="day-name">일</div>
        <div class="day-name">월</div>
        <div class="day-name">화</div>
        <div class="day-name">수</div>
        <div class="day-name">목</div>
        <div class="day-name">금</div>
        <div class="day-name">토</div>
    `; // 요일 헤더 초기화

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0부터 시작 (0: 1월, 11: 12월)

    currentMonthYear.textContent = `${year}년 ${month + 1}월`;

    // 해당 월의 첫째 날과 마지막 날
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0); // 다음 달의 0번째 날 = 이번 달의 마지막 날
    const daysInMonth = lastDayOfMonth.getDate();

    // 첫째 날의 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // 이전 달의 빈 칸 채우기
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-cell', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // 현재 월의 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = formatDate(date); // YYYY-MM-DD 형식
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');
        cell.dataset.date = dateString;

        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        // 오늘 날짜 표시
        const today = new Date();
        if (isSameDay(date, today)) {
            cell.classList.add('today');
        }

        // 선택된 날짜 표시
        if (selectedDate && isSameDay(date, selectedDate)) {
            cell.classList.add('selected');
        }

        // 해당 날짜에 수행평가가 있는지 확인하고 표시
        if (assignments[dateString] && assignments[dateString].length > 0) {
            assignments[dateString].forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.classList.add('task-item');
                taskDiv.textContent = task.content;
                cell.appendChild(taskDiv);
            });
        }

        cell.addEventListener('click', () => selectDate(date));
        calendarGrid.appendChild(cell);
    }
}

// 날짜를 YYYY-MM-DD 형식으로 포맷팅
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 두 날짜가 같은 날인지 확인 (시간 무시)
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 날짜 선택 함수
function selectDate(date) {
    // 이전에 선택된 셀에서 'selected' 클래스 제거
    if (selectedDate) {
        const prevSelectedCell = document.querySelector(`.calendar-cell[data-date="${formatDate(selectedDate)}"]`);
        if (prevSelectedCell) {
            prevSelectedCell.classList.remove('selected');
        }
    }

    selectedDate = date;
    const selectedDateString = formatDate(selectedDate);
    selectedDateDisplay.textContent = `${selectedDateString} 선택됨`;

    // 새로 선택된 셀에 'selected' 클래스 추가
    const newSelectedCell = document.querySelector(`.calendar-cell[data-date="${selectedDateString}"]`);
    if (newSelectedCell) {
        newSelectedCell.classList.add('selected');
    }

    renderTaskList(); // 선택된 날짜의 수행평가 목록 갱신
}

// 수행평가 추가 함수
function addTask() {
    if (!selectedDate) {
        alert('날짜를 먼저 선택해주세요!');
        return;
    }

    const taskContent = taskInput.value.trim();
    if (taskContent === '') {
        alert('수행평가 내용을 입력해주세요!');
        return;
    }

    const dateString = formatDate(selectedDate);
    if (!assignments[dateString]) {
        assignments[dateString] = [];
    }

    const newTask = {
        id: Date.now(), // 고유 ID 생성 (밀리초)
        content: taskContent
    };
    assignments[dateString].push(newTask);

    localStorage.setItem('assignments', JSON.stringify(assignments)); // 로컬 스토리지에 저장

    taskInput.value = ''; // 입력창 초기화
    renderCalendar(); // 캘린더 다시 그려서 셀에 수행평가 표시
    renderTaskList(); // 목록 갱신
}

// 수행평가 목록 렌더링 함수
function renderTaskList() {
    taskList.innerHTML = ''; // 목록 초기화

    // 모든 수행평가를 날짜 기준으로 정렬
    const allAssignments = [];
    for (const dateString in assignments) {
        assignments[dateString].forEach(task => {
            allAssignments.push({
                date: new Date(dateString),
                content: task.content,
                id: task.id
            });
        });
    }

    // 날짜 오름차순으로 정렬
    allAssignments.sort((a, b) => a.date - b.date);

    if (allAssignments.length === 0) {
        const noTaskItem = document.createElement('li');
        noTaskItem.textContent = '등록된 수행평가가 없습니다.';
        taskList.appendChild(noTaskItem);
        return;
    }

    allAssignments.forEach(item => {
        const listItem = document.createElement('li');
        listItem.dataset.date = formatDate(item.date);
        listItem.dataset.id = item.id;

        const taskContentDiv = document.createElement('div');
        taskContentDiv.classList.add('task-content');
        taskContentDiv.textContent = item.content;
        listItem.appendChild(taskContentDiv);

        const taskDateSpan = document.createElement('span');
        taskDateSpan.classList.add('task-date');
        taskDateSpan.textContent = formatDate(item.date);
        listItem.appendChild(taskDateSpan);

        const ddayBtn = document.createElement('button');
        ddayBtn.textContent = 'D-Day';
        ddayBtn.addEventListener('click', () => showDdayModal(item.date, item.content));
        listItem.appendChild(ddayBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => deleteTask(item.date, item.id));
        listItem.appendChild(deleteBtn);

        taskList.appendChild(listItem);
    });
}

// 수행평가 삭제 함수
function deleteTask(date, id) {
    const dateString = formatDate(date);
    if (assignments[dateString]) {
        assignments[dateString] = assignments[dateString].filter(task => task.id !== id);
        if (assignments[dateString].length === 0) {
            delete assignments[dateString]; // 해당 날짜에 더 이상 수행평가가 없으면 키 삭제
        }
        localStorage.setItem('assignments', JSON.stringify(assignments));
        renderCalendar(); // 캘린더 다시 그려서 셀에서 수행평가 표시 제거
        renderTaskList(); // 목록 갱신
    }
}

// D-Day 계산 및 모달 표시
function showDdayModal(taskDate, taskContent) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 자정으로 설정

    const targetDate = new Date(taskDate);
    targetDate.setHours(0, 0, 0, 0); // 목표 날짜의 자정으로 설정

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 밀리초를 일로 변환, 올림

    modalTaskDate.textContent = `날짜: ${formatDate(taskDate)}`;
    modalTaskContent.textContent = `내용: ${taskContent}`;

    if (diffDays > 0) {
        modalDday.textContent = `D-${diffDays}`;
    } else if (diffDays === 0) {
        modalDday.textContent = `D-Day!`;
    } else {
        modalDday.textContent = `D+${Math.abs(diffDays)}`;
    }

    ddayModal.style.display = 'flex'; // 모달 표시
}

// 모달 닫기
closeButton.addEventListener('click', () => {
    ddayModal.style.display = 'none';
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (event) => {
    if (event.target === ddayModal) {
        ddayModal.style.display = 'none';
    }
});


// 이벤트 리스너
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// 초기 렌더링
renderCalendar();
renderTaskList();
// 현재 날짜로 초기 선택 (선택된 날짜가 없을 경우)
if (!selectedDate) {
    selectDate(new Date());
}