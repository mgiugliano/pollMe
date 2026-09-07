let API_URL = 'api.php'; 
if (window.location.protocol === 'file:') {
    API_URL = 'https://giugliano.info/poll/api.php';
}

let currentPollId = null;

function parsePollNotes(notes) {
    const pollRegex = /\[POLL\]([\s\S]*?)\[\/POLL\]/i;
    const match = notes.match(pollRegex);
    if (!match) return null;
    
    const content = match[1].trim();
    const lines = content.split('\n');
    
    let title = "";
    let customId = "";
    lines.forEach(l => { 
        if(l.toLowerCase().startsWith('title:')) title = l.split(':')[1].trim(); 
        if(l.toLowerCase().startsWith('id:')) customId = l.split(':')[1].trim(); 
    });
    
    const today = new Date().toISOString().split('T')[0];
    const generatedId = 'p_' + btoa(title + today).replace(/=/g, '').substring(0, 10);
    
    const poll = { id: customId || generatedId, type: 'MCQ', subtitle: '' };
    
    lines.forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length > 0) {
            const k = key.trim().toLowerCase();
            const v = val.join(':').trim();
            if (k === 'title') poll.title = v;
            if (k === 'subtitle') poll.subtitle = v;
            if (k === 'type') poll.type = v.toUpperCase();
            if (k === 'options') poll.options = v.split(',').map(s => s.trim());
        }
    });
    return poll.title ? poll : null;
}

const chartCtx = document.getElementById('resultsChart');
let chartInstance = null;
let presenterPollData = null;
let fetchVotesInterval = null;

window.updatePollFromKeynote = function(notes) {
    const pollData = parsePollNotes(notes);
    
    if (pollData && (!presenterPollData || presenterPollData.id !== pollData.id)) {
        presenterPollData = pollData;
        currentPollId = pollData.id;
        
        document.getElementById('question-title').innerText = pollData.title;
        const subEl = document.getElementById('question-subtitle');
        if (pollData.subtitle) {
            subEl.innerText = pollData.subtitle;
            subEl.classList.remove('hidden');
        } else {
            subEl.classList.add('hidden');
        }
        
        document.getElementById('total-votes').innerText = "0";
        
        const formData = new URLSearchParams();
        formData.append('secret', 'pollme_secret_2026');
        formData.append('id', pollData.id);
        formData.append('title', pollData.title);
        formData.append('subtitle', pollData.subtitle);
        formData.append('type', pollData.type);
        if(pollData.options) formData.append('options', JSON.stringify(pollData.options));
        
        fetch(API_URL + '?action=set_poll', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(res => res.json()).catch(err => {
            console.error("Error setting poll:", err);
            document.getElementById('question-title').innerText += " (Error connecting)";
        });

        if (chartInstance) chartInstance.destroy();
        
        const bgColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const chartEl = document.getElementById('resultsChart');
        const wcEl = document.getElementById('wordcloud-container');
        
        if (pollData.type === 'WORDCLOUD') {
            if(chartEl) chartEl.classList.add('hidden');
            if(wcEl) {
                wcEl.classList.remove('hidden');
                wcEl.innerHTML = '';
            }
        } else if ((pollData.type === 'MCQ' || pollData.type === 'DONUT') && chartCtx) {
            if(chartEl) chartEl.classList.remove('hidden');
            if(wcEl) wcEl.classList.add('hidden');
            
            const isDonut = pollData.type === 'DONUT';
            chartInstance = new Chart(chartCtx, {
                type: isDonut ? 'doughnut' : 'bar',
                data: {
                    labels: pollData.options || [],
                    datasets: [{
                        label: 'Votes',
                        data: Array((pollData.options || []).length).fill(0),
                        backgroundColor: isDonut ? bgColors : '#3b82f6',
                        borderRadius: isDonut ? 0 : 8
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: isDonut ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
                    plugins: { legend: { display: isDonut, position: 'bottom', labels: { font: { size: 20 } } } },
                    animation: { duration: 500 }
                }
            });
        }
        
        if(fetchVotesInterval) clearInterval(fetchVotesInterval);
        fetchVotesInterval = setInterval(() => fetchVotes(), 1000);
    }
}

function getDeterministicColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.abs(hash) % colors.length];
}

function seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
}

function fetchVotes() {
    if (!currentPollId) return;
    fetch(API_URL + '?action=get_votes&poll_id=' + currentPollId)
        .then(res => res.json())
        .then(data => {
            document.getElementById('total-votes').innerText = data.total;
            
            if (presenterPollData && presenterPollData.type === 'WORDCLOUD') {
                const wcEl = document.getElementById('wordcloud-container');
                if (wcEl) {
                    wcEl.innerHTML = '';
                    const sortedWords = Object.entries(data.tallies).sort((a, b) => b[1] - a[1]);
                    const maxCount = sortedWords.length > 0 ? sortedWords[0][1] : 1;
                    
                    const shuffled = sortedWords.sort((a, b) => seededRandom(a[0]) - 0.5);
                    
                    shuffled.forEach(([word, count]) => {
                        const span = document.createElement('span');
                        span.innerText = word;
                        const size = 1.5 + (count / maxCount) * 4; 
                        span.style.fontSize = size + 'rem';
                        span.style.color = getDeterministicColor(word);
                        span.style.fontWeight = '800';
                        span.style.lineHeight = '1';
                        wcEl.appendChild(span);
                    });
                }
            } else if (chartInstance && presenterPollData && presenterPollData.options) {
                const newData = presenterPollData.options.map(opt => data.tallies[opt] || 0);
                chartInstance.data.datasets[0].data = newData;
                chartInstance.update();
            }
        })
        .catch(console.error);
}

window.clearCurrentPoll = function() {
    if (!currentPollId) return;
    fetch(API_URL + '?action=clear_poll&poll_id=' + currentPollId).then(() => console.log("Current poll cleared"));
}

window.clearAllPolls = function() {
    fetch(API_URL + '?action=clear_all').then(() => console.log("All polls cleared"));
}

window.closeActivePoll = function() {
    fetch(API_URL + '?action=close_poll').then(() => {
        console.log("Poll closed");
        presenterPollData = null;
        if (fetchVotesInterval) clearInterval(fetchVotesInterval);
    });
}


if (document.getElementById('voter-options')) {
    let deviceId = localStorage.getItem('pollme_device_id');
    if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('pollme_device_id', deviceId);
    }

    const waitingView = document.getElementById('waiting-view');
    const votingView = document.getElementById('voting-view');
    const votedView = document.getElementById('voted-view');
    const questionEl = document.getElementById('voter-question');
    const subtitleEl = document.getElementById('voter-subtitle');
    const optionsContainer = document.getElementById('voter-options');
    
    let lastPollTimestamp = 0;
    let lastResetTime = 0;
    
    setInterval(checkActivePoll, 2000);
    checkActivePoll(); 

    function checkActivePoll() {
        fetch(API_URL + '?action=get_poll')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'no_poll') {
                    showWaiting();
                    return;
                }
                
                const isReset = data.reset_time && data.reset_time !== lastResetTime;
                if (isReset) {
                    lastResetTime = data.reset_time;
                    if (data.id) localStorage.removeItem('voted_' + data.id);
                }
                
                if (data.status === 'closed') {
                    showWaiting();
                    return;
                }
                
                const isNewPoll = data.timestamp !== lastPollTimestamp;
                
                if (isNewPoll || isReset) {
                    lastPollTimestamp = data.timestamp;
                    currentPollId = data.id;
                    
                    if (localStorage.getItem('voted_' + currentPollId)) {
                        showVoted();
                    } else {
                        renderVotingScreen(data);
                    }
                }
            })
            .catch(console.error);
    }
    
    function renderVotingScreen(pollData) {
        waitingView.classList.add('hidden');
        votedView.classList.add('hidden');
        votingView.classList.remove('hidden');
        
        questionEl.innerText = pollData.title;
        if (pollData.subtitle) {
            subtitleEl.innerText = pollData.subtitle;
            subtitleEl.classList.remove('hidden');
        } else {
            subtitleEl.classList.add('hidden');
        }
        
        optionsContainer.innerHTML = '';
        
        if (pollData.type === 'WORDCLOUD') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Type one word...';
            input.className = "w-full p-4 border border-gray-300 rounded shadow-sm text-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center uppercase";
            input.onkeyup = (e) => { if(e.key === 'Enter') submitBtn.click(); };
            
            const submitBtn = document.createElement('button');
            submitBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded shadow transition text-lg";
            submitBtn.innerText = "Send Word";
            
            submitBtn.onclick = () => {
                const val = input.value.trim().split(' ')[0].toLowerCase();
                if (val) castVote(val);
            };
            
            optionsContainer.appendChild(input);
            optionsContainer.appendChild(submitBtn);
            
            setTimeout(() => input.focus(), 100);
        } else if (pollData.options) {
            pollData.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = "w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-4 px-4 border border-blue-400 rounded shadow transition text-lg";
                btn.innerText = opt;
                btn.onclick = () => castVote(opt);
                optionsContainer.appendChild(btn);
            });
        }
    }
    
    function castVote(choice) {
        const formData = new URLSearchParams();
        formData.append('poll_id', currentPollId);
        formData.append('device_id', deviceId);
        formData.append('choice', choice);
        
        fetch(API_URL + '?action=vote', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(() => {
            localStorage.setItem('voted_' + currentPollId, 'true');
            showVoted();
        }).catch(console.error);
    }
    
    function showWaiting() {
        votingView.classList.add('hidden');
        votedView.classList.add('hidden');
        waitingView.classList.remove('hidden');
    }
    
    function showVoted() {
        votingView.classList.add('hidden');
        waitingView.classList.add('hidden');
        votedView.classList.remove('hidden');
    }
}
