printf "Installing prerequisite libraries...\n"

pip install pandas
pip install textblob
pip install praw

printf "Finished installing prerequisite libraries\n"

# Get a list of Python files starting with a number and sorted by filename (ascending order)
python_files=$(ls [0-9]*.py | sort)

# Loop through the sorted list of Python files and run each one
while IFS= read -r file; do
    # Check if the file is a regular file (not a directory or special file)
    if [ -f "$file" ]; then
        # Print the name of the file
        printf "Running $file...\n"
        # Run the Python file
        python3 "$file"
        printf "Finished running $file\n"
    fi
done <<< "$python_files"
