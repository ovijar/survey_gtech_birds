// Multi-page Form Navigation

// Page navigation functions
function goToPage2() {
    // Validate page 1 fields
    const pcLocationId = document.getElementById('pcLocationId').value;
    const day = document.getElementById('day').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const startTime = document.getElementById('startTime').value;
    const observer = document.getElementById('observer').value;

    if (!pcLocationId || !day || !month || !year || !startTime || !observer) {
        alert('Please fill in all required fields before continuing');
        return;
    }

    // Hide page 1, show page 2
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');

    page1.classList.remove('active');
    page1.style.display = 'none';

    page2.classList.add('active');
    page2.style.display = 'block';

    // Scroll to top
    window.scrollTo(0, 0);
}

function goToPage1() {
    // Hide page 2, show page 1
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');

    page2.classList.remove('active');
    page2.style.display = 'none';

    page1.classList.add('active');
    page1.style.display = 'block';

    // Scroll to top
    window.scrollTo(0, 0);
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');

    // Ensure initial state
    if (page1 && page2) {
        page1.style.display = 'block';
        page2.style.display = 'none';
        page1.classList.add('active');
        page2.classList.remove('active');
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', goToPage2);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', goToPage1);
    }
});
