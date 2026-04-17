class NextcloudClient:
    def __init__(self, base_url: str, username: str, password: str) -> None:
        self.base_url = base_url
        self.username = username
        self.password = password

    def is_configured(self) -> bool:
        return all([self.base_url, self.username, self.password])
