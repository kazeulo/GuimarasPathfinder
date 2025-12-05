INF = float('inf')

# Adjacency Matrix (km)
graph = [
    [0, INF, INF, INF, 1.2, INF, INF, INF, INF, INF, INF, INF, INF, INF, INF],
    [INF, 0, INF, 26.3, INF, INF, 15.3, INF, 7, INF, INF, 7.3, INF, 24.1, INF],
    [INF, INF, 0, INF, INF, INF, 13.8, INF, 3.9, INF, INF, INF, INF, INF, INF],
    [INF, 26.3, INF, 0, INF, 16.3, 28.5, INF, 28.9, 7.4, 11.6, 21.9, 17.7, 4.5, 15.9],
    [1.2, INF, INF, INF, 0, 7.6, INF, 4.1, INF, INF, INF, INF, INF, 18.9, INF],
    [INF, INF, INF, 16.3, 7.6, 0, INF, 8.9, INF, INF, 21.4, INF, INF, INF, 0.35],
    [INF, 15.3, 13.8, 28.5, INF, INF, 0, INF, 11.3, 34.1, 39.3, 14.6, INF, 26.3, INF],
    [INF, INF, INF, INF, 4.1, 8.9, INF, 0, INF, 11.5, 14.4, INF, INF, 15.2, INF],
    [INF, 7, 3.9, 28.9, INF, INF, 11.3, INF, 0, INF, INF, 10.1, INF, 26.8, INF],
    [INF, INF, INF, 7.4, INF, INF, 34.1, 11.5, INF, 0, 7, INF, 19, 7.9, 17.2],
    [INF, INF, INF, 11.6, INF, 21.4, 39.3, 14.4, INF, 7, 0, INF, 22.8, 13.1, 21],
    [INF, 7.3, INF, 21.9, INF, INF, 14.6, INF, 10.1, INF, INF, 0, 5.2, 18.4, INF],
    [INF, INF, INF, 17.7, INF, INF, INF, INF, INF, 19, 22.8, 5.2, 0, 13.8, 2.2],
    [INF, 24.1, INF, 4.5, 18.9, INF, 26.3, 15.2, 26.8, 7.9, 13.1, 18.4, 13.8, 0, 12.1],
    [INF, INF, INF, 15.9, INF, 0.35, INF, INF, INF, 17.2, 21, INF, 2.2, 12.1, 0]
]

vertices = len(graph)

# Matrices For Floyd–Warshall
matrix = [[graph[i][j] for j in range(vertices)] for i in range(vertices)]
prev = [
    [None if i == j or graph[i][j] == INF else i for j in range(vertices)]
    for i in range(vertices)
]

# Floyd–Warshall Algorithm
def run_floyd_warshall():
    for k in range(vertices):
        for i in range(vertices):
            for j in range(vertices):
                if matrix[i][j] > matrix[i][k] + matrix[k][j]:
                    matrix[i][j] = matrix[i][k] + matrix[k][j]
                    prev[i][j] = prev[k][j]

run_floyd_warshall()

# Path Reconstruction
def find_shortest_path(start, end):
    if prev[start][end] is None:
        return []
    path = [end]
    while path[-1] != start:
        path.append(prev[start][path[-1]])
    return list(reversed(path))