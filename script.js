document.addEventListener('DOMContentLoaded', () => {
    const drawBtn = document.getElementById('drawBtn');
    const retryBtn = document.getElementById('retryBtn');
    const lottoMachine = document.querySelector('.lotto-machine');
    const drawnNumbersContainer = document.getElementById('drawnNumbers');
    const messageArea = document.getElementById('message'); // message-area
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
        messageArea.style.opacity = 0; // 메시지 초기에는 숨김 (명확히)
        messageArea.classList.remove('blinking'); // 깜빡임 클래스 제거
        messageArea.classList.remove('big-number'); // 큰 숫자 클래스도 제거

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
        initializeUI(); // UI 상태 초기화 (여기서 messageArea.textContent = '' 가 됨)

        // 추첨 시작 시 "추첨 중!" 텍스트 설정 및 깜빡임 애니메이션 적용
        messageArea.textContent = "추첨 중!";
        messageArea.classList.add('blinking');
        messageArea.style.opacity = 1; // 깜빡임 시작 시 보이도록

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
                    if (event.animationName === 'comeOutAndPlace') {
                        lottoMachine.removeChild(ballElement);

                        currentDrawnNumbers.push(number);
                        currentDrawnNumbers.sort((a, b) => a - b); 

                        displaySortedDrawnNumbers(currentDrawnNumbers); 

                        index++;
                        if (index < numbersToDraw.length) {
                            setTimeout(drawNextBall, intervalBetweenBalls); 
                        } else {
                            // 모든 공이 나온 후 최종 메시지 표시 및 버튼 변경
                            drawingTimeout = setTimeout(() => {
                                // "추첨 중!" 글자 제거 및 깜빡임 중지
                                messageArea.classList.remove('blinking'); 
                                messageArea.textContent = ''; // 텍스트 비우기
                                messageArea.style.opacity = 0; // 완전히 투명하게 숨기기

                                // 당첨 번호를 순차적으로 읽어주고 메시지 영역에 표시
                                readDrawnNumbersSequentially(currentDrawnNumbers, () => {
                                    // 모든 번호 읽기가 끝난 후 최종 메시지 표시 및 음성 안내
                                    showMessage(); // 화면에 메시지 표시 (원통 중앙 텍스트 변경)
                                    speakMessage("진접 직원 여러분, 이 번호로 꼭 당첨되세요!"); // 원통 중앙 메시지 읽어주기
                                    retryBtn.style.display = 'block';
                                    luckMessage.style.display = 'block';
                                });
                            }, 500); 
                        }
                    }
                }, { once: true });
            }
        }

        drawNextBall();
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
        ball.classList.add(getBallColorClass(number));
        ball.textContent = number;

        ball.style.top = 'calc(100% - 45px)';
        ball.style.left = '50%';
        ball.style.transform = 'translateX(-50%)';

        ball.style.setProperty('--animation-duration', `${animationDuration / 1000}s`);

        ball.style.animation = `comeOutAndPlace ${animationDuration / 1000}s ease-out forwards`;

        lottoMachine.appendChild(ball);
        return ball;
    }

    // 추첨된 번호들을 하단에 정렬하여 표시하는 함수
    function displaySortedDrawnNumbers(numbers) {
        drawnNumbersContainer.innerHTML = '';
        numbers.forEach(number => {
            const numberCircle = document.createElement('div');
            numberCircle.classList.add('number-circle');
            numberCircle.classList.add(getBallColorClass(number));
            numberCircle.textContent = number;
            drawnNumbersContainer.appendChild(numberCircle);
        });
    }

    // 메시지를 애니메이션 없이 두 줄로 표시 (최종 메시지용)
    function showMessage() {
        messageArea.style.opacity = 1; 
        messageArea.innerHTML = "진접 직원 여러분<br>이 번호로 꼭 당첨되세요!";
        messageArea.classList.remove('big-number'); // 혹시 모를 경우를 대비해 클래스 제거
    }

    // 특정 텍스트를 음성으로 읽어주는 함수
    function speakText(text, lang = 'ko-KR', rate = 1.0, pitch = 1.0, onstartCallback = null, onendCallback = null) {
        if (synth && text) {
            synth.cancel(); 
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rate;
            utterance.pitch = pitch;
            if (koreanVoice) {
                utterance.voice = koreanVoice;
            }

            if (onstartCallback && typeof onstartCallback === 'function') {
                utterance.onstart = onstartCallback;
            } else {
                utterance.onstart = null; 
            }
            
            if (onendCallback && typeof onendCallback === 'function') {
                utterance.onend = onendCallback;
            } else {
                utterance.onend = null; 
            }

            synth.speak(utterance);
        } else if (onendCallback && typeof onendCallback === 'function') {
            onendCallback();
        }
    }

    // 당첨 번호를 "당첨 번호는"과 함께 순차적으로 읽고 표시하는 함수
    function readDrawnNumbersSequentially(numbers, finalCallback) {
        let currentNumberIndex = 0;

        // 첫 번째: "당첨 번호는" 읽기
        speakText("당첨 번호는", 'ko-KR', 1.0, 1.0,
            null, 
            () => { 
                readNextNumber();
            }
        );

        function readNextNumber() {
            if (currentNumberIndex < numbers.length) {
                const number = numbers[currentNumberIndex];
                const textToSpeak = `${number}번`;

                speakText(textToSpeak, 'ko-KR', 1.0, 1.0,
                    () => { // onstart: 번호 읽기 시작 시
                        messageArea.textContent = number; // 원통 중앙에 번호 표시
                        messageArea.style.opacity = 1; // 보이게 함
                        messageArea.classList.add('big-number'); // 큰 숫자 클래스 추가
                    },
                    () => { // onend: 번호 읽기 종료 시
                        messageArea.textContent = ''; // 번호 사라지게 함
                        messageArea.style.opacity = 0; // 투명하게 만듦
                        messageArea.classList.remove('big-number'); // 큰 숫자 클래스 제거
                        currentNumberIndex++;
                        setTimeout(readNextNumber, 300); // 다음 번호 읽기 (짧은 딜레이)
                    }
                );
            } else {
                // 모든 번호 읽기가 끝난 후 최종 콜백 실행
                if (finalCallback && typeof finalCallback === 'function') {
                    finalCallback();
                }
            }
        }
    }

    // 최종 메시지를 한국어로 읽어주는 함수 (내부적으로 speakText 호출)
    function speakMessage(message) {
        speakText(message, 'ko-KR', 1.0, 1.0); 
    }
});