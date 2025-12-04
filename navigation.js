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
    document.getElementById('page1').classList.remove('active');
    document.getElementById('page2').classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

function goToPage1() {
    // Hide page 2, show page 1
    document.getElementById('page2').classList.remove('active');
    document.getElementById('page1').classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
        nextBtn.addEventListener('click', goToPage2);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', goToPage1);
    }
});
