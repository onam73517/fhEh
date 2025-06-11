document.addEventListener('DOMContentLoaded', () => {
    const drawBtn = document.getElementById('drawBtn');
    const retryBtn = document.getElementById('retryBtn');
    const lottoMachine = document.querySelector('.lotto-machine');
    const drawnNumbersContainer = document.getElementById('drawnNumbers');
    const messageArea = document.getElementById('message');
    const luckMessage = document.getElementById('luckMessage');
    let drawingTimeout;
    let currentDrawnNumbers = []; // 현재까지 추첨되어 표시될 번호 배열 (정렬용)

    const animationDuration = 800; // 공 애니메이션 총 시간 (0.8초)
    const intervalBetweenBalls = 600; // 공이 나오는 간격 (0.6초)

    // 초기 UI 상태 설정
    initializeUI();

    drawBtn.addEventListener('click', startDrawing);
    retryBtn.addEventListener('click', startDrawing);

    function initializeUI() {
        drawBtn.style.display = 'block';
        retryBtn.style.display = 'none';
        luckMessage.style.display = 'none';
        drawnNumbersContainer.innerHTML = ''; // 하단 번호들 초기화
        messageArea.textContent = ''; // 메시지 초기화
        messageArea.style.opacity = 0; // 메시지 초기에는 숨김
        messageArea.style.animation = 'none'; // 메시지 애니메이션 초기화 (필요 없을 수 있지만 안전하게)
        
        // 원통 안에 있을 수 있는 모든 애니메이션 중인 공들을 제거
        const allAnimatedBalls = lottoMachine.querySelectorAll('.ball');
        allAnimatedBalls.forEach(ball => ball.remove());

        currentDrawnNumbers = []; // 추첨 번호 배열 초기화
    }

    function startDrawing() {
        // 기존 타임아웃 및 애니메이션 클리어
        clearTimeout(drawingTimeout);
        initializeUI(); // UI 상태 초기화
        drawBtn.style.display = 'none'; // 추첨 시작하면 추첨하기 버튼 숨김

        const numbersToDraw = [];
        while (numbersToDraw.length < 6) {
            const randomNumber = Math.floor(Math.random() * 45) + 1; // 1부터 45까지
            if (!numbersToDraw.includes(randomNumber)) {
                numbersToDraw.push(randomNumber);
            }
        }
        // numbersToDraw를 정렬하지 않습니다. (랜덤 순서 유지)

        let index = 0;

        function drawNextBall() {
            if (index < numbersToDraw.length) {
                const number = numbersToDraw[index]; // 랜덤 순서의 번호 사용
                const ballElement = createAndAnimateBall(number); // 공 생성 및 애니메이션 시작

                ballElement.addEventListener('animationend', (event) => {
                    // 'comeOutAndPlace' 애니메이션이 끝났을 때만 처리
                    if (event.animationName === 'comeOutAndPlace') {
                        // 애니메이션이 끝난 공은 원통에서 제거
                        lottoMachine.removeChild(ballElement);

                        // 추첨된 번호를 배열에 추가하고 정렬 후 하단에 표시
                        currentDrawnNumbers.push(number);
                        currentDrawnNumbers.sort((a, b) => a - b); // 번호는 항상 정렬된 상태로 표시

                        displaySortedDrawnNumbers(currentDrawnNumbers); // 하단에 정렬된 번호들 다시 그리기

                        index++;
                        if (index < numbersToDraw.length) {
                            setTimeout(drawNextBall, intervalBetweenBalls); // 다음 공 추첨
                        } else {
                            // 모든 공이 나온 후 최종 메시지 표시 및 버튼 변경
                            drawingTimeout = setTimeout(() => {
                                showMessage(); // 메시지 내용이 showMessage 함수 내부에 정의됨
                                retryBtn.style.display = 'block';
                                luckMessage.style.display = 'block';
                            }, 500); // 메시지 표시 전 약간의 딜레이
                        }
                    }
                }, { once: true }); // animationend 이벤트는 한 번만 발생하도록
            }
        }

        drawNextBall(); // 첫 번째 공 추첨 시작
    }

    // 숫자에 따른 공 색상 클래스 반환
    function getBallColorClass(number) {
        if (number >= 1 && number <= 10) return 'color-0';
        if (number >= 11 && number <= 20) return 'color-1';
        if (number >= 21 && number <= 30) return 'color-2';
        if (number >= 31 && number <= 40) return 'color-3';
        if (number >= 41 && number <= 45) return 'color-4';
        return '';
    }

    // 공 생성 및 애니메이션 시작
    function createAndAnimateBall(number) {
        const ball = document.createElement('div');
        ball.classList.add('ball');
        ball.classList.add(getBallColorClass(number)); // 10단위 색상 적용
        ball.textContent = number;

        // 초기 위치 설정: 원통 출구에서 바로 시작
        ball.style.top = 'calc(100% - 45px)'; // 원통 바닥에 공이 걸쳐있는 위치
        ball.style.left = '50%';
        ball.style.transform = 'translateX(-50%)';

        // CSS 변수에 애니메이션 지속 시간 전달
        ball.style.setProperty('--animation-duration', `${animationDuration / 1000}s`);

        // 애니메이션 시작
        ball.style.animation = `comeOutAndPlace ${animationDuration / 1000}s ease-out forwards`;

        lottoMachine.appendChild(ball); // 공을 원통(lottoMachine) 안에 추가
        return ball;
    }

    // 추첨된 번호들을 하단에 정렬하여 표시하는 함수
    function displaySortedDrawnNumbers(numbers) {
        drawnNumbersContainer.innerHTML = ''; // 기존 내용 모두 지우기
        numbers.forEach(number => {
            const numberCircle = document.createElement('div');
            numberCircle.classList.add('number-circle');
            numberCircle.classList.add(getBallColorClass(number)); // 색상 적용
            numberCircle.textContent = number;
            drawnNumbersContainer.appendChild(numberCircle);
        });
    }


    // 메시지를 애니메이션 없이 두 줄로 표시
    function showMessage() {
        messageArea.style.opacity = 1; // 메시지 영역을 바로 보이게 함
        // 메시지 내용을 직접 설정 (두 줄로)
        messageArea.innerHTML = "진접 직원 여러분<br>이 번호로 꼭 당첨되세요!";
    }
});