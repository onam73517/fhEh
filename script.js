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

    // SpeechSynthesis API 관련 변수
    let synth;
    let koreanVoice;

    // 초기 UI 상태 설정
    initializeUI();

    // 음성 합성이 지원되는지 확인하고 한국어 음성을 로드
    if ('speechSynthesis' in window) {
        synth = window.speechSynthesis;
        // 음성 목록이 로드될 때까지 기다림
        synth.onvoiceschanged = () => {
            const voices = synth.getVoices();
            koreanVoice = voices.find(voice => voice.lang === 'ko-KR' || voice.lang === 'ko_KR');
            if (!koreanVoice) {
                koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
            }
            if (!koreanVoice) {
                console.warn("한국어 음성을 찾을 수 없습니다. 기본 음성으로 대체됩니다.");
            }
        };
        // 페이지 로드 시에도 음성 목록을 다시 불러올 수 있도록
        if (synth.getVoices().length === 0) {
            synth.onvoiceschanged();
        } else {
            const voices = synth.getVoices();
            koreanVoice = voices.find(voice => voice.lang === 'ko-KR' || voice.lang === 'ko_KR');
            if (!koreanVoice) {
                koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
            }
        }
    } else {
        console.warn("이 브라우저는 음성 합성을 지원하지 않습니다.");
    }

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

        // 혹시 재생 중인 음성이 있다면 중지
        if (synth) {
            synth.cancel();
        }
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

                // 공이 나올 때 번호를 읽는 부분 제거
                // speakNumber(number);

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
                                // 모든 공이 나온 후 "당첨 번호는"이라고 말하고 번호 읽기
                                const spokenNumbers = currentDrawnNumbers.join('번, '); // 예: "1번, 5번, 10번"
                                speakText(`당첨 번호는 ${spokenNumbers}번 입니다!`);

                                // 번호 읽기가 끝난 후 메시지 표시 및 메시지 읽기
                                const messageUtterance = new SpeechSynthesisUtterance(`당첨 번호는 ${spokenNumbers}번 입니다!`);
                                messageUtterance.lang = 'ko-KR';
                                if (koreanVoice) {
                                    messageUtterance.voice = koreanVoice;
                                }
                                messageUtterance.onend = () => {
                                    showMessage(); // 화면에 메시지 표시
                                    speakMessage("진접 직원 여러분, 이 번호로 꼭 당첨되세요!"); // 원통 중앙 메시지 읽어주기
                                    retryBtn.style.display = 'block';
                                    luckMessage.style.display = 'block';
                                };
                                synth.speak(messageUtterance);

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

    // 특정 텍스트를 음성으로 읽어주는 함수
    function speakText(text, lang = 'ko-KR', rate = 1.0, pitch = 1.0, callback) {
        if (synth && text) {
            synth.cancel(); // 현재 재생 중인 음성이 있다면 중지
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rate;
            utterance.pitch = pitch;
            if (koreanVoice) {
                utterance.voice = koreanVoice;
            }
            if (callback) {
                utterance.onend = callback;
            }
            synth.speak(utterance);
        } else if (callback) {
            // 음성 합성이 지원되지 않으면 즉시 콜백 실행
            callback();
        }
    }

    // 최종 메시지를 한국어로 읽어주는 함수
    function speakMessage(message) {
        speakText(message, 'ko-KR', 1.0, 1.0); // 메시지는 기본 속도로 읽기
    }
});