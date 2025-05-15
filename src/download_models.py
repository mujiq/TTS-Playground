import os
from transformers import AutoProcessor, AutoModel
import torch

def download_and_quantize_model(model_name, save_dir):
    print(f"Downloading {model_name}...")
    
    # Create directory if it doesn't exist
    os.makedirs(save_dir, exist_ok=True)
    
    # Download model and processor
    processor = AutoProcessor.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    
    # Save the original model
    processor_path = os.path.join(save_dir, "processor")
    model_path = os.path.join(save_dir, "model")
    processor.save_pretrained(processor_path)
    model.save_pretrained(model_path)
    
    print(f"Original model saved to {model_path}")
    
    # Quantize the model to 8-bit precision if it's a PyTorch model
    try:
        if hasattr(model, "to"):
            # Quantize to 8-bit
            model_quantized = model
            model_quantized = torch.quantization.quantize_dynamic(
                model_quantized, {torch.nn.Linear}, dtype=torch.qint8
            )
            
            # Save the quantized model
            quantized_path = os.path.join(save_dir, "model_quantized")
            model_quantized.save_pretrained(quantized_path)
            print(f"Quantized model saved to {quantized_path}")
    except Exception as e:
        print(f"Quantization failed: {e}")
        print("Continuing with the original model only")

def main():
    # Top 5 TTS models from HuggingFace
    models = [
        "coqui/XTTS-v2",           # Best overall multilingual TTS
        "nari-labs/Dia-1.6B",      # Popular, trending TTS model
        "hexgrad/Kokoro-82M",      # Efficient smaller model
        "suno/bark",               # Well-known multipurpose TTS
        "SparkAudio/Spark-TTS-0.5B" # Good balance of quality and size
    ]
    
    base_dir = "models/tts"
    
    for model_name in models:
        model_dir = os.path.join(base_dir, model_name.split("/")[-1])
        download_and_quantize_model(model_name, model_dir)

if __name__ == "__main__":
    main() 