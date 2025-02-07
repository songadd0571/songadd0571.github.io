// app.js
document.getElementById('inputForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        score: document.getElementById('score').value,
        province: document.getElementById('province').value,
        subjects: [...document.querySelectorAll('input[name="subjects"]:checked')]
                  .map(c => c.value),
        interests: document.getElementById('interests').value
    };

    showLoading();
    
    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        showRecommendations(result.recommendations);
    } catch (error) {
        showError("请求失败，请稍后重试");
    }
});

function showLoading() {
    document.getElementById('result').classList.remove('hidden');
    document.querySelector('.recommendations').innerHTML = '';
    document.querySelector('.loading').style.display = 'block';
}

function showRecommendations(recommendations) {
    document.querySelector('.loading').style.display = 'none';
    const container = document.querySelector('.recommendations');
    container.innerHTML = recommendations
        .map(r => `<div class="recommendation-item">
                      <h3>${r.school} - ${r.major}</h3>
                      <p>${r.description}</p>
                   </div>`)
        .join('');
}