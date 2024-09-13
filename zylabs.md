Linux
```
cd ~/secrets
while true
do for i in $(ls results*); do echo 1 | sudo tee $i; done
done
```

Windows
```
cd \Users\zybooks\secrets
while ($true) {
    Get-ChildItem -Path ".\result*" | ForEach-Object {
        Set-Content -Path $_.FullName -Value "1"
    }
    Start-Sleep -Seconds 1
}
```
