print ("\nGuimaras Path Finder.\n")

# initialize variable INF with the value of positive infinity
INF = float('inf')

# adjacency matrix representing the graph
graph = [[0, INF, INF, INF, 1.2, INF, INF, INF, INF, INF, INF, INF, INF, INF, INF],
        [INF, 0, INF, 26.3, INF, INF, 15.3, INF, 7, INF, INF, 7.3, INF, 24.1, INF],
        [INF, INF, 0, INF, INF , INF, 13.8, INF, 3.9, INF, INF, INF, INF, INF, INF],
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
        [INF, INF, INF, 15.9, INF, 0.35, INF, INF, INF, 17.2, 21, INF, 2.2, 12.1, 0]]

    # the graph is is 2D list where each inner list represents a row of the matrix
    # the values in the matrix represent the distances between vertices
    # INF represents an unreachable distance, 0 represents the distance from a vertex to itself

# number of vertices in the graph
vertices = len(graph)

# create a copy of the graph above
matrix = [[0 if i == j else graph[i][j] for j in range(vertices)] for i in range(vertices)]

# create a matrix to keep track the previous vertices when finding the shortest path from i to j
# if there is no path between i and j, or the distance is INF, the value is set to None
# otherwise, it is set to the vertex i
prev = [[None if i == j or graph[i][j] == INF else i for j in range(vertices)] for i in range(vertices)]

# performing floyd warshall algo
# iterate over all vertices and consider each vertex as an intermediate vertex
for k in range(vertices):
    for i in range(vertices):
        for j in range(vertices):
            # check if going through vertex k gives a shorter path
            if matrix[i][j] > matrix[i][k] + matrix[k][j]:
                # update the 'matrix' list
                matrix[i][j] = matrix[i][k] + matrix[k][j]
                # update the 'prev' list
                prev[i][j] = prev[k][j]

# display the transitive closure of the graph
print("\nTransitive closure:\n")
for i in range(vertices):
    for j in range(vertices):
        if matrix[i][j] == INF:
            print("inf", end="\t")
        else:
            print("{:.2f}".format(matrix[i][j]), end="\t")
    print()

# function to find the shortest path between two vertices
def find_shortest_path(start, end):
    if start == end:
        return [start]
    if prev[start][end] is None:
        return []
    path = [end]
    while prev[start][path[-1]] != start:
        path.append(prev[start][path[-1]])
    path.append(start)
    return list(reversed(path))

# loop for main menu
while True:
    print("\n1. Display a specific path.")
    print("2. Display all paths.")
    print("3. Nearest Neighbor.")
    print("4. Exit.")
    choice = input("Your choice: ")

    if choice == "1":
        # Prompt for getting the starting and ending vertices from the user
        start = int(input("Enter the starting vertex (1 to {}): ".format(vertices)))
        end = int(input("Enter the ending vertex (1 to {}): ".format(vertices)))

        # call find_shortest_path function to find the shortest path between the vertices
        path = find_shortest_path(start - 1, end - 1)
        if path:
            path_str = " -> ".join(str(vertex + 1) for vertex in path)
            print("Shortest path from {} to {}: {}".format(start, end, path_str))
            print("Total Distance: ", matrix[start-1][end-1])
        else:
            print("No path found.")

    elif choice == "2":
        # print all the shortest paths between pairs of vertices
        print("\nShortest paths:\n")
        for i in range(vertices):
            for j in range(vertices):
                if i != j and matrix[i][j] != INF:
                    path = find_shortest_path(i, j)
                    if path:
                        path_str = " -> ".join(str(vertex + 1) for vertex in path)
                        print("From {} to {}: {} (Distance: {:.2f})".format(i + 1, j + 1, path_str, matrix[i][j]))

    elif choice == "3":
        # find the nearest neighbor path starting from vertex 1
        start = 1

        # set all vertices as unvisited
        unvisited = set(range(vertices))

        # remove 1 from unvisited
        unvisited.remove(start - 1)
        path = [start - 1]

        # loop through the unvisited vertices
        while unvisited:
            current = path[-1]
            next_vertex = min(unvisited, key=lambda vertex: graph[current][vertex])
            path.append(next_vertex)
            # remove a vertex from unvisited list if the part went thru
            unvisited.remove(next_vertex)
        path_str = " -> ".join(str(vertex + 1) for vertex in path)
        total_distance = sum(graph[path[i]][path[i+1]] for i in range(len(path) - 1))
        print("Nearest Neighbor Path: {}".format(path_str))
        print("Total Distance: {:.2f}".format(total_distance))

    elif choice == "4":
        # exit the program
        print("Exiting...")
        break

    else:
        # handle invalid input
        print("Invalid choice. Please try again.")
