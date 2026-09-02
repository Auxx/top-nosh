# TODO

- [x] Onboarding
- [x] Edit Recipe page
- [x] Delete Recipe
- [x] Dashboard page
- [x] Implement shopping list

## Docker

### Build, tag, and push image

```shell
docker build --no-cache -t auxx/top-nosh .
docker build --platform linux/amd64,linux/arm64 --no-cache -t auxx/top-nosh .
docker image tag auxx/top-nosh auxx/top-nosh:0.0.1
docker image tag auxx/top-nosh auxx/top-nosh:latest
docker push auxx/top-nosh
```
