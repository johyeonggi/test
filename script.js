// DOM 요소 가져오기
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// 모달 관련 요소
const taskModal = document.getElementById('taskModal');
const closeButton = document.querySelector('.close-button');
const modalDateDisplay = document.getElementById('modalDateDisplay');
const modalTaskInput = document.getElementById('modalTaskInput');
const modalAddTaskButton = document.getElementById('modalAddTaskButton');
const modalTaskList = document.getElementById('modalTaskList');

let currentDate = new Date(); // 현재 날짜 (캘린더의 기준)
let selectedDateForModal = null; // 모달에서 현재 관리하는 날짜

// 로컬 스토리지에서 수행평가 데이터 로드
// { "YYYY-MM-DD": [{id: ..., content: ...}, ...], ... }
const assignments = JSON.parse(localStorage.getItem('assignments')) || {};

// 캘린더 생성 함수
function renderCalendar() {
    // 요일 헤더 초기화 및 추가
    calendarGrid.innerHTML = `
        <div class="day-name">일</div>
        <div class="day-name">월</div>
        <div class="day-name">화</div>
        <div class="day-name">수</div>
        <div class="day-name">목</div>
        <div class="day-name">금</div>
        <div class="day-name">토</div>
    `;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0부터 시작 (0: 1월, 11: 12월)

    currentMonthYear.textContent = `${year}년 ${month + 1}월`;

    // 해당 월의 첫째 날과 마지막 날
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
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

        // 해당 날짜에 수행평가가 있는지 확인하고 첫 번째 항목을 요약해서 표시
        if (assignments[dateString] && assignments[dateString].length > 0) {
            const firstTask = assignments[dateString][0];
            const taskSummaryDiv = document.createElement('div');
            taskSummaryDiv.classList.add('task-item-summary');
            taskSummaryDiv.textContent = firstTask.content; // 첫 번째 수행평가만 요약 표시
            cell.appendChild(taskSummaryDiv);
        }

        // 날짜 셀 클릭 시 모달 열기
        cell.addEventListener('click', () => openTaskModal(date));
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

// 수행평가 모달 열기
function openTaskModal(date) {
    selectedDateForModal = date; // 모달에서 사용할 날짜 설정
    const dateString = formatDate(selectedDateForModal);
    modalDateDisplay.textContent = `${dateString} 수행평가`;
    modalTaskInput.value = ''; // 입력창 초기화
    renderModalTaskList(dateString); // 해당 날짜의 수행평가 목록 렌더링
    taskModal.style.display = 'flex'; // 모달 표시
}

// 모달 내에서 수행평가 목록 렌더링
function renderModalTaskList(dateString) {
    modalTaskList.innerHTML = ''; // 목록 초기화

    const tasksForDate = assignments[dateString] || [];

    if (tasksForDate.length === 0) {
        const noTaskItem = document.createElement('li');
        noTaskItem.textContent = '등록된 수행평가가 없습니다.';
        modalTaskList.appendChild(noTaskItem);
        return;
    }

    tasksForDate.forEach(task => {
        const listItem = document.createElement('li');
        listItem.dataset.id = task.id;

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('task-content-wrapper');

        const taskContentSpan = document.createElement('span');
        taskContentSpan.textContent = task.content;
        contentWrapper.appendChild(taskContentSpan);

        const ddaySpan = document.createElement('span');
        ddaySpan.classList.add('task-dday');
        ddaySpan.textContent = calculateDday(new Date(dateString));
        contentWrapper.appendChild(ddaySpan);

        listItem.appendChild(contentWrapper);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => deleteTask(dateString, task.id));
        listItem.appendChild(deleteBtn);

        modalTaskList.appendChild(listItem);
    });
}

// D-Day 계산 함수
function calculateDday(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 자정으로 설정

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0); // 목표 날짜의 자정으로 설정

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        return `D-${diffDays}`;
    } else if (diffDays === 0) {
        return `D-Day!`;
    } else {
        return `D+${Math.abs(diffDays)}`;
    }
}


// 모달 내에서 수행평가 추가 함수
function addTaskInModal() {
    if (!selectedDateForModal) {
        alert('날짜가 선택되지 않았습니다.');
        return;
    }

    const taskContent = modalTaskInput.value.trim();
    if (taskContent === '') {
        alert('수행평가 내용을 입력해주세요!');
        return;
    }

    const dateString = formatDate(selectedDateForModal);
    if (!assignments[dateString]) {
        assignments[dateString] = [];
    }

    const newTask = {
        id: Date.now(), // 고유 ID 생성 (밀리초)
        content: taskContent
    };
    assignments[dateString].push(newTask);

    localStorage.setItem('assignments', JSON.stringify(assignments)); // 로컬 스토리지에 저장

    modalTaskInput.value = ''; // 입력창 초기화
    renderModalTaskList(dateString); // 모달 목록 갱신
    renderCalendar(); // 캘린더 다시 그려서 셀에 수행평가 표시
}

// 수행평가 삭제 함수
function deleteTask(dateString, id) {
    if (assignments[dateString]) {
        assignments[dateString] = assignments[dateString].filter(task => task.id !== id);
        if (assignments[dateString].length === 0) {
            delete assignments[dateString]; // 해당 날짜에 더 이상 수행평가가 없으면 키 삭제
        }
        localStorage.setItem('assignments', JSON.stringify(assignments));
        renderModalTaskList(dateString); // 모달 목록 갱신
        renderCalendar(); // 캘린더 다시 그려서 셀에서 수행평가 표시 제거
    }
}

// 모달 닫기
closeButton.addEventListener('click', () => {
    taskModal.style.display = 'none';
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (event) => {
    if (event.target === taskModal) {
        taskModal.style.display = 'none';
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

modalAddTaskButton.addEventListener('click', addTaskInModal);
modalTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTaskInModal();
    }
});

// 초기 렌더링
// 2025년 1월부터 달력을 표시하도록 설정
currentDate.setFullYear(2025);
currentDate.setMonth(0); // 1월
renderCalendar();