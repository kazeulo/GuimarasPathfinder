from floyd import (
    INF, vertices, matrix, find_shortest_path
)

# VALIDATE USER INPUT
def get_valid_vertex(prompt):
    while True:
        try:
            n = int(input(prompt))
            if 1 <= n <= vertices:
                return n
            print("\033[91mInvalid number. Enter 1–15.\033[0m")
        except ValueError:
            print("\033[91mPlease enter a valid integer.\033[0m")


# NEAREST NEIGHBOR TOUR
def nearest_neighbor_tour(return_to_start=True):
    start = 0
    unvisited = set(range(vertices))
    unvisited.remove(start)

    path = [start]

    while unvisited:
        curr = path[-1]

        next_vertex = min(
            unvisited,
            key=lambda v: matrix[curr][v] if matrix[curr][v] != INF else float('inf')
        )

        if matrix[curr][next_vertex] == INF:
            break

        path.append(next_vertex)
        unvisited.remove(next_vertex)

    if return_to_start:
        path.append(start)

    total = sum(matrix[path[i]][path[i+1]] for i in range(len(path) - 1))
    return path, total

# MAIN MENU LOOP
def menu():
    while True:
        print("\n\033[93m=============================\033[0m")
        print("  \033[92mGUIMARAS PATH FINDER MENU\033[0m")
        print("\033[93m=============================\033[0m")
        print("1. Display a specific path")
        print("2. Display all shortest paths")
        print("3. Nearest Neighbor Tour (with return)")
        print("4. Exit\n")

        choice = input("Your choice: ")

        # ---------------- OPTION 1 ----------------
        if choice == "1":
            start = get_valid_vertex("Start point (1–15): ") - 1
            end = get_valid_vertex("End point (1–15): ") - 1

            path = find_shortest_path(start, end)

            if path:
                print("\033[96mPath:\033[0m", " -> ".join(str(x + 1) for x in path))
                print("\033[96mDistance:\033[0m {:.2f} km".format(matrix[start][end]))
            else:
                print("\033[91mNo path found.\033[0m")

        # ---------------- OPTION 2 ----------------
        elif choice == "2":
            print("\n\033[96mAll Shortest Paths (in km):\n\033[0m")

            for i in range(vertices):
                for j in range(vertices):
                    if i != j and matrix[i][j] != INF:
                        path = find_shortest_path(i, j)
                        print(
                            f"{i+1} → {j+1}: "
                            f"{' -> '.join(str(p+1) for p in path)} "
                            f"(Distance: {matrix[i][j]:.2f} km)"
                        )

        # ---------------- OPTION 3 ----------------
        elif choice == "3":
            path, total = nearest_neighbor_tour(return_to_start=True)

            print("\n\033[96mNearest Neighbor Tour (with return):\033[0m")
            print(" -> ".join(str(x + 1) for x in path))
            print("\033[96mTotal Distance:\033[0m {:.2f} km".format(total))

        # ---------------- OPTION 4 ----------------
        elif choice == "4":
            print("\033[92mExiting...\033[0m")
            break

        # ---------------- INVALID ----------------
        else:
            print("\033[91mInvalid choice. Try again.\033[0m")


# Run menu
menu()
