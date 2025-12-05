# Application of Floyd–Warshall Algorithm in Optimizing Tour Routes

### (Selected Tourist Destinations in Guimaras)

## 📌 Overview

This program is a simple demonstration of how the **Floyd–Warshall algorithm** can be used to find the shortest travel routes between different tourist destinations in **Guimaras**.
Each point (1–15) in the program represents a specific destination, and the distances between them are stored in an adjacency matrix.

---

## 🗺️ How the Program Works

* The **graph** is a list of distances between destinations.
* A value of **INF** means there is *no direct road* between two destinations.
* The Floyd–Warshall algorithm computes the **shortest distance between every pair** of destinations.
* The program also includes a **Nearest Neighbor** option to create a quick tour route.

---

## 🧭 Features

### ✔ 1. Display a Specific Path

Shows the shortest path and total distance from one destination to another.

### ✔ 2. Display All Paths

Displays all shortest paths between all destination pairs.

### ✔ 3. Nearest Neighbor Tour

Creates a simple tour that visits all destinations once by always choosing the closest next point.

### ✔ 4. Exit

Closes the program.

---

## 🧠 What the Points Represent

Each number in the program (1 to 15) represents a **tourist destination in Guimaras**.
The distances are based on sample values for demonstration and can be replaced with actual road distances.

---

## 🎯 Purpose of the Program

This proof-of-concept shows how graph algorithms can be used to:

* Improve travel planning
* Identify efficient tour routes
* Support tourism route optimization in Guimaras

---

## ▶️ How to Use

1. Run the program in Python.
2. Choose from the menu options.
3. Enter destination numbers when asked.
4. View the shortest route or tour.

---

## 📌 Summary

This program helps illustrate how the Floyd–Warshall algorithm can optimize travel routes between various tourist destinations in Guimaras. It serves as a simple model for studying or designing an optimized tour system.
