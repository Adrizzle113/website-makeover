# Git Setup Guide - Connect to GitHub

## Current Status
- ✅ Git repository is initialized
- ⚠️ Remote is currently pointing to: `https://github.com/Adrizzle113/EdwardPrivate.git`
- 🎯 Need to update to: `https://github.com/Adrizzle113/website-makeover`

## Steps to Connect

### Option 1: Update Existing Remote (Recommended)

If you want to keep your existing commits and just change the remote:

```bash
cd /Users/areahnaorea/Downloads/website-makeover-main

# Update the remote URL
git remote set-url origin https://github.com/Adrizzle113/website-makeover.git

# Verify the change
git remote -v

# You should see:
# origin  https://github.com/Adrizzle113/website-makeover.git (fetch)
# origin  https://github.com/Adrizzle113/website-makeover.git (push)
```

### Option 2: Remove and Re-add Remote

If you prefer to start fresh:

```bash
cd /Users/areahnaorea/Downloads/website-makeover-main

# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/Adrizzle113/website-makeover.git

# Verify
git remote -v
```

## After Connecting

### 1. Check Current Branch
```bash
git branch
```

### 2. Fetch from GitHub
```bash
git fetch origin
```

### 3. Check if Local and Remote are in Sync
```bash
git status
```

### 4. If Remote Has Different History

If the GitHub repository has commits that your local doesn't have:

**Option A: Merge (if you want to keep both histories)**
```bash
git pull origin main --allow-unrelated-histories
```

**Option B: Force Push (⚠️ WARNING: This overwrites GitHub history)**
```bash
# Only do this if you're sure you want to overwrite GitHub
git push origin main --force
```

**Option C: Start Fresh (if GitHub repo is empty or you want to start over)**
```bash
# Make sure you're on main branch
git checkout main

# Push your local code
git push -u origin main
```

## Recommended Workflow

1. **First, check what's on GitHub:**
   ```bash
   git fetch origin
   git log origin/main --oneline
   ```

2. **If GitHub is empty or you want to use your local code:**
   ```bash
   git push -u origin main
   ```

3. **If GitHub has code you want to merge:**
   ```bash
   git pull origin main --allow-unrelated-histories
   # Resolve any conflicts if they occur
   git push origin main
   ```

## Verify Connection

After setting up, verify everything works:

```bash
# Check remote
git remote -v

# Check status
git status

# Try fetching (this doesn't modify your code)
git fetch origin
```

## Troubleshooting

### Authentication Issues

If you get authentication errors:

1. **Use Personal Access Token (Recommended):**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` permissions
   - Use it as password when prompted

2. **Or use SSH (Alternative):**
   ```bash
   # Change remote to SSH
   git remote set-url origin git@github.com:Adrizzle113/website-makeover.git
   ```

### Permission Denied

If you get permission errors:
- Make sure you have write access to the repository
- Check that the repository exists and you're a collaborator
- Verify the repository URL is correct

### Branch Mismatch

If GitHub uses `master` instead of `main`:
```bash
# Rename your local branch
git branch -m main master

# Or update GitHub to use main (if you have admin access)
```

## Quick Command Reference

```bash
# Update remote URL
git remote set-url origin https://github.com/Adrizzle113/website-makeover.git

# Check remote
git remote -v

# Fetch from GitHub
git fetch origin

# Push to GitHub
git push -u origin main

# Pull from GitHub
git pull origin main
```

## Next Steps After Connection

1. ✅ Verify connection works
2. ✅ Push your local changes
3. ✅ Set up `.gitignore` if not already done
4. ✅ Consider setting up GitHub Actions for CI/CD
5. ✅ Enable branch protection if needed

