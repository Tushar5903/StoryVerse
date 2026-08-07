CREATE TABLE otp_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL
);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
