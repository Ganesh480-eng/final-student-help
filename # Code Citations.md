# Code Citations

## License: unknown
https://github.com/mohsen-bahrami-mb/task_manager/tree/aeed3c4c24624027eb0bc07c14a356a17983b6ff/startup/config.js

```
use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')
```


## License: unknown
https://github.com/ousunny/travelpal/tree/b2d1ecc8969333298fbc74a0451686142c4ced19/routes/api/auth.js

```
, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
```

# PowerShell
Invoke-WebRequest "http://localhost:3000/api/public/download/1" -OutFile test-download.bin

