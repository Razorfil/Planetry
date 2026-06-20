#include <Wire.h>
#include <deneyap.h>
#include "Adafruit_TCS34725.h" // Adafruit TCS34725 kütüphanesi yüklü olmalıdır.

// Gaz Sensör Pin Tanımlaması
#define GAZ_PIN A0

// Renk sensörü ayarları (50ms entegrasyon süresi hızlı ve manuel okuma için idealdir)
Adafruit_TCS34725 tcs = Adafruit_TCS34725(TCS34725_INTEGRATIONTIME_50MS, TCS34725_GAIN_1X);

void setup() {
  Serial.begin(115200); // Bilgisayarla haberleşme hızı (web uygulamasındaki baudRate ile aynı olmalı)
  pinMode(GAZ_PIN, INPUT);

  // Renk sensörü başlatılıyor
  if (!tcs.begin()) {
    Serial.println("HATA: TCS34725 sensörü bulunamadı! Kabloları kontrol edin.");
    while (1); // Sensör bağlanana kadar kodu durdur
  }

  Serial.println("==================================================");
  Serial.println("   ASTROAI-FORGE GEZEGEN TEST İSTASYONU AKTİF     ");
  Serial.println("==================================================");
}

void loop() {
  uint16_t r, g, b, c;

  // 1. TCS34725 sensöründen renk verilerini oku
  tcs.getRawData(&r, &g, &b, &c);

  // 2. Turnusol Kağıdı Renk Analizi ve pH Belirleme
  String ortam_durumu = "NOTR";
  float manuel_pH = 7.0;

  // Turnusol kağıdı aside batıp kırmızılaştığında R (Kırmızı) değeri belirgin şekilde artar
  if (r > b && (r - b) > 80) {
    ortam_durumu = "ASIDIK (Turnusol Kırmızı)";
    // Kırmızının yoğunluğuna göre kabaca 1 ile 6 arasında bir pH gösterelim
    manuel_pH = map(r, 200, 3000, 6, 1);
    if (manuel_pH < 1) manuel_pH = 1.0;
  }
  // Turnusol kağıdı baza batıp mavileştiğinde B (Mavi) değeri belirgin şekilde artar
  else if (b > r && (b - r) > 10) {
    ortam_durumu = "BAZIK (Turnusol Mavi)";
    // Mavinin yoğunluğuna göre kabaca 8 ile 14 arasında bir pH gösterelim
    manuel_pH = map(b, 200, 3000, 8, 14);
    if (manuel_pH > 14) manuel_pH = 14.0;
  }

  // 3. Gaz Sensörünü Oku ve SI Birimine (kg/m³) Çevir
  int gaz_ham = analogRead(GAZ_PIN);
  // Deneyap Kart 12-bit ADC kullanır (0-4095). Bunu simüle bir yoğunluk birimine çeviriyoruz.
  float gaz_yogunlugu = (gaz_ham / 4095.0) * 10.0;

  // 4. Ekranda / Web Uygulamasında Okunacak Şekilde Düzenli Gösterim
  Serial.println("\n--- YENİ ÖLÇÜM VERİLERİ (Arayüze Girilecek Değerler) ---");
  Serial.print("Gezegen Sıvı pH Değeri       : "); Serial.println(manuel_pH, 1);
  Serial.print("Turnusol Renk Durumu         : "); Serial.println(ortam_durumu);
  Serial.print("Zararlı Gaz Yoğunluğu (kg/m³): "); Serial.print(gaz_yogunlugu, 2); Serial.println(" kg/m³");
  Serial.println("-------------------------------------------------------");

  delay(3000); // Ekranın çok hızlı akıp okunmayı zorlaştırmaması için süreyi 3 saniye yaptık
}
