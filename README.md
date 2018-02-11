# Collage Generator for 4chan

Features:
- Creating and modifying collages
- Fetching images directly from threads
- Embedded 4chan browser
- Cropping images
- Live preview
- Duplicates detection based on perceptual hash

## Usage

### Run development
Requires PostgreSQL with `collage` as db name, user name and password.
```bash
cd app && npm run start
```

### Run production

```bash
docker-compose up
```
