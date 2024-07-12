let size = 21;
let maze = [];
let solution = null;
let editMode = false;
let allPaths = [];
let showingAllPaths = false;

function toggleCell(x, y) {
    if (editMode) {
        maze[y][x] = 1 - maze[y][x];  // Toggle between 0 and 1
        if (showingAllPaths) {
            findAllPaths();
        }
        renderMaze();
    }
}

function findAllPaths() {
    const visited = Array(size).fill().map(() => Array(size).fill(false));
    allPaths = [];
    
    function dfs(x, y, path) {
        if (x === size - 2 && y === size - 2) {
            allPaths.push([...path]);
            return;
        }
        
        visited[y][x] = true;
        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (isValid(nx, ny) && maze[ny][nx] === 0 && !visited[ny][nx]) {
                path.push([nx, ny]);
                dfs(nx, ny, path);
                path.pop();
            }
        });
        visited[y][x] = false;
    }
    
    dfs(1, 1, [[1, 1]]);
}

function initializeMaze() {
    maze = Array(size).fill().map(() => Array(size).fill(1));
}

function isValid(x, y) {
    return x >= 0 && x < size && y >= 0 && y < size;
}

function generateMaze(x, y) {
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    directions.sort(() => Math.random() - 0.5);

    maze[y][x] = 0;

    for (const [dx, dy] of directions) {
        const nx = x + dx * 2, ny = y + dy * 2;
        if (isValid(nx, ny) && maze[ny][nx] === 1) {
            maze[y + dy][x + dx] = 0;
            generateMaze(nx, ny);
        }
    }
}

function solveMaze() {
    const visited = Array(size).fill().map(() => Array(size).fill(false));
    const parent = Array(size).fill().map(() => Array(size).fill(null));
    const queue = [[1, 1]];
    visited[1][1] = true;

    while (queue.length > 0) {
        const [x, y] = queue.shift();
        if (x === size - 2 && y === size - 2) {
            return reconstructPath(parent);
        }

        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (isValid(nx, ny) && maze[ny][nx] === 0 && !visited[ny][nx]) {
                visited[ny][nx] = true;
                parent[ny][nx] = [x, y];
                queue.push([nx, ny]);
            }
        });
    }
    return null;
}

function reconstructPath(parent) {
    const path = [];
    let current = [size - 2, size - 2];
    while (current) {
        path.unshift(current);
        current = parent[current[1]][current[0]];
    }
    return path;
}

function renderMaze() {
    document.documentElement.style.setProperty('--maze-size', size);
    const mazeElement = document.getElementById('maze');
    mazeElement.innerHTML = '';
    mazeElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    mazeElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell ' + (maze[y][x] ? 'wall' : 'path');
            mazeElement.appendChild(cell);
        }
    }

    mazeElement.children[size + 1].className = 'cell start';
    mazeElement.children[size * size - size - 2].className = 'cell end';

    if (showingAllPaths && allPaths.length > 0) {
        allPaths.forEach((path, pathIndex) => {
            path.forEach(([x, y]) => {
                const index = y * size + x;
                const colorClass = `path-${pathIndex % 20}`; // Utilise 20 couleurs différentes
                mazeElement.children[index].classList.add(colorClass);
            });
        });
    }

    if (editMode) {
        Array.from(mazeElement.children).forEach((cell, index) => {
            cell.addEventListener('click', () => {
                const x = index % size;
                const y = Math.floor(index / size);
                toggleCell(x, y);
            });
        });
    }
}

function generateNewMaze() {
    initializeMaze();
    generateMaze(1, 1);
    maze[1][1] = 0;
    maze[size - 2][size - 2] = 0;
    solution = solveMaze();
    if (showingAllPaths) {
        findAllPaths();
    }
    renderMaze();
}

function generateDatapack(blockName) {
    let commands = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (maze[y][x] === 1) {
                commands.push(`setblock ~${x} ~ ~${y} ${blockName}`);
                commands.push(`setblock ~${x} ~1 ~${y} ${blockName}`);
            }
        }
    }
    return commands.join('\n');
}

function downloadDatapack(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maze_datapack.mcfunction';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
    const sizeInput = document.getElementById('sizeInput');
    const reloadBtn = document.getElementById('reloadBtn');
    const revealBtn = document.getElementById('revealBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const editBtn = document.getElementById('editBtn');

    generateNewMaze();

    reloadBtn.addEventListener('click', () => {
        size = parseInt(sizeInput.value);
        if (size % 2 === 0) size++;
        if (size < 5) size = 5;
        if (size > 1111) size = 1111;
        sizeInput.value = size;
        generateNewMaze();
    });

    revealBtn.addEventListener('click', () => {
        showingAllPaths = !showingAllPaths;
        if (showingAllPaths) {
            findAllPaths();
            revealBtn.classList.add('active');
            revealBtn.textContent = "Cacher chemins";
        } else {
            revealBtn.classList.remove('active');
            revealBtn.textContent = "Révéler chemins";
        }
        renderMaze();
    });

    editBtn.addEventListener('click', () => {
        editMode = !editMode;
        editBtn.textContent = editMode ? 'Mode Normal' : 'Mode Édition';
        editBtn.classList.toggle('active');
        renderMaze();
    });

    downloadBtn.addEventListener('click', () => {
        const blockName = document.getElementById('blockInput').value || 'stone';
        const datapackContent = generateDatapack(blockName);
        downloadDatapack(datapackContent);
    });
});

document.documentElement.style.setProperty('--maze-size', size);