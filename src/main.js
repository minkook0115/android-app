import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const displayContent = document.getElementById('display-content');
    const displayContainer = document.getElementById('display');
    const historyListContainer = document.getElementById('historyListContainer');
    const historyModal = document.getElementById('historyModal');

    let formula = '';
    let cursorPos = 0;
    let selectedHistoryIndex = -1;
    let isCalculated = false; // 방금 계산 결과를 출력했는지 여부 추적

    function updateDisplay() {
        displayContent.innerHTML = '';

        for (let i = 0; i <= formula.length; i++) {
            if (i === cursorPos) {
                const cursorSpan = document.createElement('span');
                cursorSpan.id = 'custom-cursor';
                displayContent.appendChild(cursorSpan);
            }

            if (i < formula.length) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char-span';
                charSpan.textContent = formula[i];
                charSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    cursorPos = i;
                    isCalculated = false; // 중간 위치 터치 시 계산 완료 상태 해제
                    updateDisplay();
                });
                displayContent.appendChild(charSpan);
            }
        }

        if (cursorPos === formula.length && !document.getElementById('custom-cursor')) {
            const cursorSpan = document.createElement('span');
            cursorSpan.id = 'custom-cursor';
            displayContent.appendChild(cursorSpan);
        }

        displayContainer.scrollTop = displayContainer.scrollHeight;
    }

    displayContainer.addEventListener('click', (e) => {
        if (e.target === displayContainer || e.target === displayContent) {
            cursorPos = formula.length;
            updateDisplay();
        }
    });

    function appendChar(char) {
        if (char === 'C') {
            formula = '';
            cursorPos = 0;
            isCalculated = false;
            updateDisplay();
            return;
        }

        // 계산 결과가 출력된 상태에서 새 수식 입력(숫자, '.', '(' 등)을 시작할 때 화면 클리어
        // (단, 연산자 +, -, *, /는 기존 결과값 뒤에 이어붙여 연산 가능)
        const isOperator = ['+', '-', '*', '/'].includes(char);
        if (isCalculated && !isOperator) {
            formula = '';
            cursorPos = 0;
        }
        isCalculated = false;

        formula = formula.substring(0, cursorPos) + char + formula.substring(cursorPos);
        cursorPos++;
        updateDisplay();
    }

    function deleteChar() {
        if (cursorPos > 0) {
            formula = formula.substring(0, cursorPos - 1) + formula.substring(cursorPos);
            cursorPos--;
            isCalculated = false;
            updateDisplay();
        }
    }

    function calculate() {
        if (!formula) return;
        try {
            const sanitizedFormula = formula.replace(/\n/g, '');
            const result = new Function(`return ${sanitizedFormula}`)();
            
            const record = `${sanitizedFormula} = ${result}`;
            saveToStorage(record);

            formula = String(result);
            cursorPos = formula.length;
            isCalculated = true; // 결과 출력 완료 상태로 설정
            updateDisplay();
        } catch (error) {
            formula = '오류';
            cursorPos = formula.length;
            isCalculated = true;
            updateDisplay();
        }
    }

    function getHistory() {
        const history = localStorage.getItem('calc_history');
        return history ? JSON.parse(history) : [];
    }

    function saveToStorage(record) {
        const history = getHistory();
        history.push(record);
        localStorage.setItem('calc_history', JSON.stringify(history));
    }

    function openHistoryModal() {
        const history = getHistory();
        historyListContainer.innerHTML = '';
        selectedHistoryIndex = -1;

        if (history.length === 0) {
            historyListContainer.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">저장된 기록이 없습니다.</div>';
            historyModal.style.display = 'flex';
            return;
        }

        // 최신 기록이 위로 오도록 내림차순(역순) 정렬
        const reversedIndices = history.map((_, i) => i).reverse();

        reversedIndices.forEach((originalIndex) => {
            const item = history[originalIndex];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            const itemStr = (typeof item === 'object' && item !== null) ? (item.formula || '') : String(item);
            itemDiv.textContent = itemStr;

            itemDiv.addEventListener('click', () => {
                document.querySelectorAll('.history-item').forEach(el => el.classList.remove('selected'));
                itemDiv.classList.add('selected');
                selectedHistoryIndex = originalIndex;
            });

            itemDiv.addEventListener('dblclick', () => {
                selectedHistoryIndex = originalIndex;
                useFormula();
            });

            historyListContainer.appendChild(itemDiv);
        });

        // 첫 번째 항목(가장 최신 기록) 기본 선택
        const firstItem = historyListContainer.querySelector('.history-item');
        if (firstItem) {
            firstItem.classList.add('selected');
            selectedHistoryIndex = reversedIndices[0];
        }

        historyModal.style.display = 'flex';
    }

    function closeHistoryModal() {
        historyModal.style.display = 'none';
    }

    function useFormula() {
        if (selectedHistoryIndex === -1) return;

        const history = getHistory();
        const fullText = history[selectedHistoryIndex];
        let formulaOnly = fullText;
        if (fullText.includes('=')) {
            formulaOnly = fullText.split('=')[0].trim();
        }

        formula = formulaOnly;
        cursorPos = formula.length;
        isCalculated = false;
        updateDisplay();
        closeHistoryModal();
    }

    function deleteSelected() {
        if (selectedHistoryIndex === -1) return;

        const history = getHistory();
        history.splice(selectedHistoryIndex, 1);
        localStorage.setItem('calc_history', JSON.stringify(history));
        openHistoryModal();
    }

    function clearAllHistory() {
        localStorage.removeItem('calc_history');
        openHistoryModal();
    }

    // --- 이벤트 리스너 바인딩 ---
    document.querySelector('.buttons').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const action = target.getAttribute('data-action');
        if (action) {
            appendChar(action);
        }
    });

    document.getElementById('btn-equals').addEventListener('click', calculate);
    document.getElementById('btn-del').addEventListener('click', deleteChar);
    document.getElementById('history-btn').addEventListener('click', openHistoryModal);

    // 모달 내 버튼 이벤트
    document.getElementById('btn-use-formula').addEventListener('click', useFormula);
    document.getElementById('btn-delete-selected').addEventListener('click', deleteSelected);
    document.getElementById('btn-clear-all').addEventListener('click', clearAllHistory);
    document.getElementById('btn-close-modal').addEventListener('click', closeHistoryModal);

    updateDisplay();
});