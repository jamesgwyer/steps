const DATA_URL = 'steps.json';

async function initTimeline() {
    const currentMonthContainer = document.getElementById('current-month-container');
    const archiveContainer = document.getElementById('archive-container');
    const lastUpdatedElement = document.getElementById('last-updated');

    if (!currentMonthContainer && !archiveContainer && !lastUpdatedElement) return;

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Could not fetch step data');
        const data = await response.json();
        
        // --- Handle the "Last Updated" text ---
        if (lastUpdatedElement) {
            const allDates = Object.keys(data);
            if (allDates.length > 0) {
                const mostRecentDate = new Date(allDates[0]);
                const formattedDate = mostRecentDate.toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                lastUpdatedElement.textContent = `Last updated: ${formattedDate}`;
            }
        }

        // Only group and render calendar structures if a calendar container is on the page
        if (currentMonthContainer || archiveContainer) {
            const groupedByMonth = {};
            Object.entries(data).forEach(([dateStr, steps]) => {
                const dateObj = new Date(dateStr);
                const monthKey = dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                if (!groupedByMonth[monthKey]) {
                    groupedByMonth[monthKey] = [];
                }
                groupedByMonth[monthKey].push({ dateStr, steps, dateObj });
            });

            const monthKeys = Object.keys(groupedByMonth);
            if (monthKeys.length === 0) return;

            // Render current month if container exists
            if (currentMonthContainer) {
                renderMonthGrid(monthKeys[0], groupedByMonth[monthKeys[0]], data, currentMonthContainer, true);
            }

            // Render archived months independently if container exists
            if (archiveContainer) {
                if (monthKeys.length > 1) {
                    for (let i = 1; i < monthKeys.length; i++) {
                        renderMonthGrid(monthKeys[i], groupedByMonth[monthKeys[i]], data, archiveContainer, false);
                    }
                } else {
                    archiveContainer.innerHTML = `<p style="opacity: 0.5; padding: 1em 0;">No archived months found yet.</p>`;
                }
            }
        }
    } catch (err) {
        const target = currentMonthContainer || archiveContainer;
        if (target) {
            target.innerHTML = `<p style="color:red;">Error loading data: ${err.message}</p>`;
        } else {
            console.error(err);
        }
    }
}

function renderMonthGrid(monthTitle, daysInData, fullData, targetContainer, isCurrent) {
    const section = document.createElement('section');
    section.className = 'month-section';

    let monthTotalSteps = 0;

    const refDate = daysInData[0].dateObj;
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cellsToRender = [];

    let startDayIndex = new Date(year, month, 1).getDay();
    startDayIndex = startDayIndex === 0 ? 6 : startDayIndex - 1;

    for (let i = 0; i < startDayIndex; i++) {
        cellsToRender.push({ type: 'empty' });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const stepCount = fullData[currentStr];
        
        if (stepCount !== undefined) {
            monthTotalSteps += stepCount;
        }

        cellsToRender.push({ type: 'day', day, stepCount });
    }

    const heading = document.createElement('h1');
    heading.className = 'month-heading';
    heading.style.display = 'flex';
    heading.style.justifyContent = 'space-between';
    heading.style.maxWidth = '800px';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = isCurrent ? `${monthTitle} (Current)` : monthTitle;

    const totalSpan = document.createElement('span');
    totalSpan.style.opacity = '0.5';
    totalSpan.style.fontWeight = '400';
    totalSpan.textContent = `Total: ${monthTotalSteps.toLocaleString()} steps`;

    heading.appendChild(titleSpan);
    heading.appendChild(totalSpan);
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'days-grid';

    cellsToRender.forEach(cellData => {
        const cell = document.createElement('div');
        if (cellData.type === 'empty') {
            cell.className = 'day-cell empty';
        } else {
            cell.className = 'day-cell';
            const numLabel = document.createElement('span');
            numLabel.className = 'day-number';
            numLabel.textContent = cellData.day;
            cell.appendChild(numLabel);

            if (cellData.stepCount !== undefined) {
                cell.classList.add('has-data');
                const stepSpan = document.createElement('span');
                stepSpan.className = 'step-display';
                stepSpan.textContent = cellData.stepCount.toLocaleString();
                cell.appendChild(stepSpan);
            }
        }
        grid.appendChild(cell);
    });

    section.appendChild(grid);
    targetContainer.appendChild(section);
}

document.addEventListener('DOMContentLoaded', initTimeline);