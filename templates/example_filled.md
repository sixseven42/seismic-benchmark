# 填写示例

以下是一份已填写的示例，供参考格式和风格。

---

## Benchmark 示例


| 字段             | 内容                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| id             | `synth-fap-snr`                                                                                                                         |
| name           | `Synthetic First Arrival (varying SNR)`                                                                                                 |
| task           | `first_arrival_picking`                                                                                                                 |
| icon           | `⏱️`                                                                                                                                    |
| description    | `Synthetic refraction shot records spanning input SNR from -5 dB to 20 dB. Ground-truth first-break times are exact from the modeling.` |
| data_source    | `synthetic`                                                                                                                             |
| dimensions     | `96 × 2000 samples`                                                                                                                     |
| primary_metric | `accuracy`                                                                                                                              |
| metrics        | `["accuracy", "f1", "mae"]`                                                                                                             |
| tags           | `["Refraction", "Synthetic", "Variable SNR"]`                                                                                           |
| citation       | `Hu et al., IEEE GRSL 2019`                                                                                                             |
| download_url   | `https://zenodo.org/record/3501234`                                                                                                     |
| model_count    | 0                                                                                                                                       |


---

## Model 示例


| 字段             | 内容                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id             | `unet-tl-2023`                                                                                                                                                                        |
| name           | `UNET-TL`                                                                                                                                                                             |
| authors        | `Li et al.`                                                                                                                                                                           |
| org            | `Peking University, Qingdao University, Sinopec`                                                                                                                                      |
| year           | 2023                                                                                                                                                                                  |
| emoji          | `🔬`                                                                                                                                                                                  |
| type           | `deep_learning`                                                                                                                                                                       |
| tasks          | `["coherent_noise_suppression"]`                                                                                                                                                      |
| description    | `Proposes transfer learning accelerated U-Net for adaptive multiple subtraction, reusing prior parameters to reduce epochs, achieving same accuracy with ~40% less computation time.` |
| paper_url      | `https://doi.org/10.1553/jse.32.373`                                                                                                                                                  |
| code_url       | `null`                                                                                                                                                                                |
| weights_url    | `null`                                                                                                                                                                                |
| is_open_source | `false`                                                                                                                                                                               |


---

## Result 示例


| 字段           | 内容                                          |
| ------------ | ------------------------------------------- |
| model_id     | `unet-tl-2023`                              |
| benchmark_id | `synth-denoise-coherent`                    |
| scores       | `{"snr": 12.5, "ssim": 0.85, "rmse": 0.04}` |
| is_sota      | `false`                                     |
| paper_url    | `https://doi.org/10.1553/jse.32.373`        |
| code_url     | `null`                                      |
| date_added   | `2024-03-10`                                |


---

## 批量 Result 示例


| model_id         | benchmark_id             | scores                        | is_sota | date_added   |
| ---------------- | ------------------------ | ----------------------------- | ------- | ------------ |
| `unet-tl-2023`   | `synth-denoise-coherent` | `{"snr": 12.5, "ssim": 0.85}` | `false` | `2024-03-10` |
| `gabor-lsr-2024` | `synth-denoise-coherent` | `{"snr": 14.2, "ssim": 0.91}` | `true`  | `2024-06-20` |
| `dnn-2022`       | `field-land-denoise`     | `{"snr": 8.3, "ssim": 0.72}`  | `false` | `2024-01-15` |


