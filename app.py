from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import random
import datetime
import pickle
import numpy as np
import base64
import io
from crops_dataset import CROP_INFO, AGRICULTURAL_KNOWLEDGE, get_crop_info, get_all_crop_names, search_crops

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# API Keys from environment variables
GEMINI_API_KEY = os.environ.get('Gemini_API_key', 'AIzaSyCyqp4qFCtQcSpRXrDdfLw_6ywLzYBYZio')
WEATHER_API_KEY = os.environ.get('Weather_API_key')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-pro')

logger.info(f"Gemini API configured: {bool(GEMINI_API_KEY)}")
logger.info(f"Weather API configured: {bool(WEATHER_API_KEY)}")

# Load ML model and scaler for crop prediction
try:
    with open('backend/data/model.pkl', 'rb') as f:
        crop_model = pickle.load(f)
    with open('backend/data/scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    MODEL_AVAILABLE = True
    logger.info("✅ Crop prediction model loaded successfully")
except Exception as e:
    MODEL_AVAILABLE = False
    crop_model = None
    scaler = None
    logger.warning(f"❌ Could not load crop prediction model: {e}")

# Crop information is now imported from crops_dataset.py

# Try to import optional dependencies
try:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    GENAI_AVAILABLE = True
    logger.info("✅ Google GenerativeAI imported and configured")
    logger.info(f"Using Gemini API key: {GEMINI_API_KEY[:10]}...")
    logger.info(f"Using Gemini model: {GEMINI_MODEL}")
except ImportError as e:
    GENAI_AVAILABLE = False
    logger.warning(f"❌ Google GenerativeAI not available: {e}")
except Exception as e:
    GENAI_AVAILABLE = False
    logger.error(f"❌ Error configuring Gemini API: {e}")

try:
    import requests
    REQUESTS_AVAILABLE = True
    logger.info("✅ Requests library available")
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("❌ Requests library not available")

# Agricultural Knowledge Base is now imported from crops_dataset.py

def get_fallback_response(user_message):
    """Generate intelligent fallback response based on agricultural knowledge"""
    user_message_lower = user_message.lower()
    
    # Check for specific crop mentions first
    for crop, data in AGRICULTURAL_KNOWLEDGE.items():
        if 'keywords' in data:
            for keyword in data['keywords']:
                if keyword.lower() in user_message_lower:
                    return random.choice(data['responses'])
    
    # Check for question patterns and provide contextual responses
    if any(word in user_message_lower for word in ['how', 'when', 'what', 'which', 'where', 'why']):
        if any(word in user_message_lower for word in ['grow', 'plant', 'cultivate', 'farming']):
            return "🌾 For successful crop cultivation, consider: soil type, climate, water availability, and market demand. Choose crops suitable for your region and season. Would you like specific advice for a particular crop?"
        
        elif any(word in user_message_lower for word in ['price', 'cost', 'market', 'sell']):
            return "💰 Crop prices vary by region, season, and quality. Check local mandis, online platforms, and government MSP rates. Focus on crops with good demand in your area."
        
        elif any(word in user_message_lower for word in ['disease', 'problem', 'issue', 'pest']):
            return "🐛 Common crop problems include pests, diseases, and nutrient deficiencies. Share photos of affected plants for better diagnosis. Use IPM practices for sustainable pest control."
        
        elif any(word in user_message_lower for word in ['fertilizer', 'nutrition', 'nutrients']):
            return "🌱 Soil testing helps determine nutrient needs. Use balanced NPK fertilizers with organic matter. Apply in split doses for better efficiency and reduced losses."
    
    # Check for greetings
    if any(word in user_message_lower for word in ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening']):
        return "🙏 Namaste! I'm KrishiMitra, your farming assistant. I can help with crop advice, pest control, fertilizers, irrigation, and market information. What would you like to know?"
    
    # Check for thanks
    if any(word in user_message_lower for word in ['thank', 'thanks', 'dhanyawad', 'धन्यवाद']):
        return "🙏 You're welcome! Happy farming! Feel free to ask if you need more agricultural advice. Good luck with your crops!"
    
    # General farming topics
    farming_topics = [
        "🌾 I can help with crop selection based on your soil and climate conditions.",
        "🌱 Ask me about fertilizer recommendations for specific crops and growth stages.",
        "💧 I provide irrigation scheduling and water management advice.",
        "🐛 Get pest and disease identification with treatment recommendations.",
        "📊 Learn about market prices and best crops for your region.",
        "🌿 Discover organic farming practices and sustainable agriculture methods."
    ]
    
    return f"🌾 I'm KrishiMitra, your AI farming assistant! {random.choice(farming_topics)}\n\nYou can ask me about:\n• Crop cultivation (rice, wheat, maize, cotton, tomato, potato)\n• Fertilizers and soil management\n• Irrigation and water management\n• Pest control and disease management\n• Seeds and varieties\n• Organic farming practices\n• Market prices and crop selection\n\nWhat specific farming question do you have?"

@app.route('/api/predict', methods=['POST'])
def predict_crop():
    """Predict the best crop based on soil and environmental parameters"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Extract and validate input values
        try:
            nitrogen = float(data['nitrogen'])
            phosphorus = float(data['phosphorus'])
            potassium = float(data['potassium'])
            temperature = float(data['temperature'])
            humidity = float(data['humidity'])
            ph = float(data['ph'])
            rainfall = float(data['rainfall'])
        except (ValueError, TypeError) as e:
            return jsonify({
                'success': False,
                'error': 'All input values must be valid numbers'
            }), 400
        
        # Check for NaN values
        import math
        nan_fields = []
        if math.isnan(nitrogen): nan_fields.append('nitrogen')
        if math.isnan(phosphorus): nan_fields.append('phosphorus')
        if math.isnan(potassium): nan_fields.append('potassium')
        if math.isnan(temperature): nan_fields.append('temperature')
        if math.isnan(humidity): nan_fields.append('humidity')
        if math.isnan(ph): nan_fields.append('ph')
        if math.isnan(rainfall): nan_fields.append('rainfall')
        
        if nan_fields:
            return jsonify({
                'success': False,
                'error': f'Invalid values for: {", ".join(nan_fields)}. Please enter valid numbers.'
            }), 400
        
        # Validate ranges
        if not (0 <= nitrogen <= 300):
            return jsonify({'success': False, 'error': 'Nitrogen should be between 0-300 kg/hectare'}), 400
        if not (0 <= phosphorus <= 150):
            return jsonify({'success': False, 'error': 'Phosphorus should be between 0-150 kg/hectare'}), 400
        if not (0 <= potassium <= 200):
            return jsonify({'success': False, 'error': 'Potassium should be between 0-200 kg/hectare'}), 400
        if not (0 <= temperature <= 50):
            return jsonify({'success': False, 'error': 'Temperature should be between 0-50°C'}), 400
        if not (0 <= humidity <= 100):
            return jsonify({'success': False, 'error': 'Humidity should be between 0-100%'}), 400
        if not (3 <= ph <= 10):
            return jsonify({'success': False, 'error': 'pH should be between 3-10'}), 400
        if not (0 <= rainfall <= 3000):
            return jsonify({'success': False, 'error': 'Rainfall should be between 0-3000 mm'}), 400
        
        # Prepare input for prediction
        input_features = np.array([[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]])
        
        if MODEL_AVAILABLE and crop_model and scaler:
            try:
                # Scale the input features
                input_scaled = scaler.transform(input_features)
                
                # Make prediction
                prediction = crop_model.predict(input_scaled)[0]
                prediction_proba = crop_model.predict_proba(input_scaled)[0]
                
                # Get confidence (probability of predicted class)
                confidence = float(max(prediction_proba))
                
                # Map prediction to crop name (assuming the model outputs crop names)
                predicted_crop = str(prediction).lower()
                
                # Get crop information from our comprehensive dataset
                crop_info = get_crop_info(predicted_crop)
                if not crop_info:
                    crop_info = {
                        'emoji': '🌱',
                        'season': 'Varies by region',
                        'duration': '90-150 days',
                        'yield': 'Varies by variety',
                        'market_price': 'Check local markets',
                        'tips': 'Follow good agricultural practices for best results.'
                    }
                
                logger.info(f"Crop prediction successful: {predicted_crop} (confidence: {confidence:.2f})")
                
                return jsonify({
                    'success': True,
                    'prediction': {
                        'crop': predicted_crop.title(),
                        'confidence': confidence,
                        'emoji': crop_info['emoji']
                    },
                    'crop_info': crop_info,
                    'input_parameters': {
                        'nitrogen': nitrogen,
                        'phosphorus': phosphorus,
                        'potassium': potassium,
                        'temperature': temperature,
                        'humidity': humidity,
                        'ph': ph,
                        'rainfall': rainfall
                    }
                })
                
            except Exception as model_error:
                logger.error(f"Model prediction error: {model_error}")
                # Fallback to rule-based prediction
                return get_rule_based_prediction(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall)
        else:
            # Model not available, use rule-based prediction
            logger.info("Using rule-based prediction (model not available)")
            return get_rule_based_prediction(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall)
            
    except Exception as e:
        logger.error(f"Crop prediction error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during prediction'
        }), 500

def get_rule_based_prediction(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall):
    """Rule-based crop prediction when ML model is not available"""
    
    # Simple rule-based logic for crop recommendation
    if rainfall > 150 and temperature > 25 and humidity > 70:
        if nitrogen > 80:
            predicted_crop = 'rice'
            confidence = 0.85
        else:
            predicted_crop = 'maize'
            confidence = 0.78
    elif rainfall < 100 and temperature > 20:
        if ph > 7:
            predicted_crop = 'wheat'
            confidence = 0.82
        else:
            predicted_crop = 'potato'
            confidence = 0.75
    elif temperature > 30 and humidity < 60:
        predicted_crop = 'cotton'
        confidence = 0.80
    elif temperature < 25 and rainfall > 100:
        predicted_crop = 'tomato'
        confidence = 0.77
    else:
        # Default recommendation based on balanced conditions
        predicted_crop = 'maize'
        confidence = 0.70
    
    crop_info = get_crop_info(predicted_crop)
    if not crop_info:
        crop_info = get_crop_info('maize')  # fallback to maize
        if not crop_info:
            crop_info = {
                'emoji': '🌱',
                'season': 'Varies by region',
                'duration': '90-150 days',
                'yield': 'Varies by variety',
                'market_price': 'Check local markets',
                'tips': 'Follow good agricultural practices for best results.'
            }
    
    return jsonify({
        'success': True,
        'prediction': {
            'crop': predicted_crop.title(),
            'confidence': confidence,
            'emoji': crop_info['emoji']
        },
        'crop_info': crop_info,
        'input_parameters': {
            'nitrogen': nitrogen,
            'phosphorus': phosphorus,
            'potassium': potassium,
            'temperature': temperature,
            'humidity': humidity,
            'ph': ph,
            'rainfall': rainfall
        },
        'note': 'Prediction based on agricultural rules (ML model not available)'
    })

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Upload and convert image to base64 for disease detection"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No image file selected'}), 400
        
        # Read the image file
        image_data = file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        logger.info(f"Image uploaded successfully, size: {len(image_data)} bytes")
        
        return jsonify({
            'success': True,
            'image_base64': image_base64,
            'message': 'Image uploaded successfully'
        })
        
    except Exception as e:
        logger.error(f"Image upload error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to upload image'
        }), 500

@app.route('/api/disease-detection', methods=['POST'])
def detect_disease():
    """Detect plant disease from base64 image (mock implementation)"""
    try:
        data = request.json
        
        if not data or 'image_base64' not in data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400
        
        image_base64 = data['image_base64']
        
        if not image_base64:
            return jsonify({'success': False, 'error': 'Empty image data'}), 400
        
        logger.info("Processing disease detection request")
        
        # Mock disease detection (replace with actual ML model when available)
        diseases = [
            {
                'name': 'Leaf Blight',
                'confidence': 0.85,
                'severity': 'Moderate',
                'emoji': '🍃',
                'description': 'A common fungal disease affecting leaves, causing brown spots and yellowing.',
                'treatment': 'Apply copper-based fungicide spray every 7-10 days. Remove affected leaves immediately.',
                'prevention': 'Ensure proper air circulation, avoid overhead watering, and maintain field hygiene.'
            },
            {
                'name': 'Powdery Mildew',
                'confidence': 0.78,
                'severity': 'Mild',
                'emoji': '🌿',
                'description': 'White powdery coating on leaves and stems, reducing photosynthesis.',
                'treatment': 'Spray with neem oil or sulfur-based fungicide. Improve air circulation.',
                'prevention': 'Plant resistant varieties, avoid overcrowding, and water at soil level.'
            },
            {
                'name': 'Bacterial Wilt',
                'confidence': 0.92,
                'severity': 'Severe',
                'emoji': '🦠',
                'description': 'Bacterial infection causing wilting and yellowing of plants.',
                'treatment': 'Remove infected plants immediately. Apply copper sulfate solution to soil.',
                'prevention': 'Use disease-free seeds, practice crop rotation, and maintain proper drainage.'
            },
            {
                'name': 'Healthy Plant',
                'confidence': 0.95,
                'severity': 'None',
                'emoji': '✅',
                'description': 'Plant appears healthy with no visible signs of disease.',
                'treatment': 'No treatment needed. Continue regular care and monitoring.',
                'prevention': 'Maintain current care practices and monitor for any changes.'
            }
        ]
        
        # Randomly select a disease for demonstration
        detected_disease = random.choice(diseases)
        
        logger.info(f"Disease detection result: {detected_disease['name']} (confidence: {detected_disease['confidence']:.2f})")
        
        return jsonify({
            'success': True,
            'disease': {
                'name': detected_disease['name'],
                'confidence': detected_disease['confidence'],
                'severity': detected_disease['severity'],
                'emoji': detected_disease['emoji']
            },
            'diagnosis': {
                'description': detected_disease['description'],
                'treatment': detected_disease['treatment'],
                'prevention': detected_disease['prevention']
            }
        })
        
    except Exception as e:
        logger.error(f"Disease detection error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to detect disease'
        }), 500

@app.route('/')
def home():
    return jsonify({
        'message': 'KrishiMitra API Running', 
        'status': 'OK',
        'version': 'full',
        'gemini_configured': bool(GEMINI_API_KEY),
        'weather_configured': bool(WEATHER_API_KEY),
        'services': {
            'genai': GENAI_AVAILABLE,
            'requests': REQUESTS_AVAILABLE,
            'crop_model': MODEL_AVAILABLE
        },
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'services': {
            'gemini_ai': GENAI_AVAILABLE,
            'weather_api': REQUESTS_AVAILABLE,
            'knowledge_base': True,
            'crop_prediction': MODEL_AVAILABLE
        },
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    user_msg = data.get('message', '')
    lang = data.get('lang', 'en-US')
    concise = bool(data.get('concise', True))
    
    if not user_msg:
        return jsonify({'success': False, 'error': 'No message provided'}), 400
    
    logger.info(f"Chatbot request: {user_msg}")
    
    # Try Gemini first if available
    if GENAI_AVAILABLE and GEMINI_API_KEY:
        # Updated model list with more reliable models
        gemini_models = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro']
        
        for model_name in gemini_models:
            try:
                logger.info(f"Trying Gemini model: {model_name}")
                model_ai = genai.GenerativeModel(model_name)
                style = 'Answer very concisely in 1-3 sentences.' if concise else 'Answer clearly and helpfully.'
                prompt = f"You are a farming expert helping Indian farmers. {style} Question: {user_msg}"
                
                # Add generation config for better reliability
                generation_config = {
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                }
                
                resp = model_ai.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                text = (resp.text or '').strip()
                
                if text and len(text) > 10:
                    logger.info(f"✅ Successfully used Gemini model: {model_name}")
                    return jsonify({
                        'success': True, 
                        'response': text, 
                        'lang': lang, 
                        'concise': concise,
                        'source': 'gemini',
                        'model_used': model_name
                    })
                else:
                    logger.warning(f"⚠️ Gemini model {model_name} returned empty response")
                    
            except Exception as gemini_error:
                error_msg = str(gemini_error)
                logger.error(f"❌ Gemini model {model_name} failed: {error_msg}")
                
                # Log specific error types for debugging
                if "404" in error_msg:
                    logger.error(f"Model {model_name} not found - trying next model")
                elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
                    logger.error(f"API quota/rate limit exceeded for {model_name}")
                elif "permission" in error_msg.lower():
                    logger.error(f"Permission denied for {model_name} - check API key")
                
                continue
    
    # Fallback to agricultural knowledge base
    try:
        fallback_response = get_fallback_response(user_msg)
        logger.info(f"Using knowledge base fallback for: {user_msg}")
        
        return jsonify({
            'success': True, 
            'response': fallback_response, 
            'lang': lang, 
            'concise': concise,
            'source': 'knowledge_base'
        })
        
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return jsonify({
            'success': True, 
            'response': '🌾 I\'m here to help with farming questions! You can ask me about crops like rice, wheat, maize, cotton, fertilizers, irrigation, pest control, and more.',
            'source': 'emergency_fallback'
        })

@app.route('/api/test-fallback', methods=['POST'])
def test_fallback():
    """Test endpoint to verify fallback system with various questions"""
    test_questions = [
        "Hello",
        "How to grow rice?",
        "What is the best fertilizer for tomatoes?",
        "When to plant wheat?",
        "How to control pests in cotton?",
        "What are the irrigation requirements for maize?",
        "Thank you for the help",
        "What is the market price of potatoes?",
        "How to improve soil health?",
        "What are organic farming practices?"
    ]
    
    results = []
    for question in test_questions:
        try:
            response = get_fallback_response(question)
            results.append({
                'question': question,
                'response': response,
                'status': 'success'
            })
        except Exception as e:
            results.append({
                'question': question,
                'response': str(e),
                'status': 'error'
            })
    
    return jsonify({
        'success': True,
        'test_results': results,
        'total_questions': len(test_questions),
        'knowledge_base_topics': list(AGRICULTURAL_KNOWLEDGE.keys())
    })

@app.route('/api/test-gemini', methods=['POST'])
def test_gemini():
    """Test endpoint to specifically check Gemini API functionality"""
    test_message = "What is the best crop for sandy soil?"
    
    gemini_status = {
        'api_key_configured': bool(GEMINI_API_KEY),
        'api_key_source': 'environment' if os.environ.get('Gemini_API_key') else 'hardcoded',
        'api_key_preview': f"{GEMINI_API_KEY[:10]}..." if GEMINI_API_KEY else None,
        'genai_available': GENAI_AVAILABLE,
        'model_configured': GEMINI_MODEL,
        'test_results': []
    }
    
    if GENAI_AVAILABLE and GEMINI_API_KEY:
        gemini_models = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro']
        
        for model_name in gemini_models:
            try:
                logger.info(f"Testing Gemini model: {model_name}")
                model_ai = genai.GenerativeModel(model_name)
                prompt = f"You are a farming expert. Answer concisely: {test_message}"
                resp = model_ai.generate_content(prompt)
                text = (resp.text or '').strip()
                
                gemini_status['test_results'].append({
                    'model': model_name,
                    'status': 'success' if text else 'empty_response',
                    'response_length': len(text) if text else 0,
                    'response_preview': text[:100] + '...' if len(text) > 100 else text,
                    'error': None
                })
                
                if text and len(text) > 10:
                    logger.info(f"✅ Gemini model {model_name} working")
                else:
                    logger.warning(f"⚠️ Gemini model {model_name} returned empty response")
                    
            except Exception as gemini_error:
                error_msg = str(gemini_error)
                logger.error(f"❌ Gemini model {model_name} failed: {error_msg}")
                gemini_status['test_results'].append({
                    'model': model_name,
                    'status': 'error',
                    'response_length': 0,
                    'response_preview': None,
                    'error': error_msg
                })
    else:
        gemini_status['test_results'].append({
            'model': 'none',
            'status': 'not_available',
            'response_length': 0,
            'response_preview': None,
            'error': 'Gemini API not available or not configured'
        })
    
    return jsonify({
        'success': True,
        'gemini_status': gemini_status,
        'environment_variables': {
            'Gemini_API_key': 'SET' if os.environ.get('Gemini_API_key') else 'NOT_SET',
            'GEMINI_MODEL': os.environ.get('GEMINI_MODEL', 'NOT_SET'),
            'Weather_API_key': 'SET' if os.environ.get('Weather_API_key') else 'NOT_SET'
        }
    })

@app.route('/api/weather', methods=['POST'])
def weather():
    if not REQUESTS_AVAILABLE:
        return jsonify({'success': False, 'error': 'Weather service not available'}), 503
        
    data = request.json
    lat = data.get('latitude', 19.076)
    lon = data.get('longitude', 72.8777)
    
    # Mock weather response for now (can be enhanced later)
    return jsonify({
        'success': True,
        'location': {'city': 'Mumbai', 'country': 'IN'},
        'current': {
            'temperature': 28,
            'humidity': 75,
            'condition': 'partly cloudy',
            'windSpeed': 15,
            'precipitation': 0
        },
        'forecast': [
            {'date': '2025-09-27', 'maxTemp': 30, 'minTemp': 24, 'condition': 'sunny'},
            {'date': '2025-09-28', 'maxTemp': 29, 'minTemp': 23, 'condition': 'cloudy'},
            {'date': '2025-09-29', 'maxTemp': 27, 'minTemp': 22, 'condition': 'rainy'}
        ],
        'agricultural_advisory': [
            {'title': 'Good Weather for Farming', 'description': 'Ideal conditions for field operations and crop growth.'}
        ]
    })

@app.route('/api/test-predict', methods=['GET'])
def test_predict():
    """Test endpoint to verify prediction system is working"""
    try:
        # Test with sample rice conditions
        test_data = {
            'nitrogen': 90,
            'phosphorus': 60,
            'potassium': 50,
            'temperature': 27,
            'humidity': 85,
            'ph': 6.0,
            'rainfall': 200
        }
        
        # Test the prediction function
        input_features = np.array([[
            test_data['nitrogen'], test_data['phosphorus'], test_data['potassium'],
            test_data['temperature'], test_data['humidity'], test_data['ph'], test_data['rainfall']
        ]])
        
        result = {
            'model_available': MODEL_AVAILABLE,
            'test_input': test_data,
            'status': 'success'
        }
        
        if MODEL_AVAILABLE and crop_model and scaler:
            try:
                input_scaled = scaler.transform(input_features)
                prediction = crop_model.predict(input_scaled)[0]
                confidence = float(max(crop_model.predict_proba(input_scaled)[0]))
                
                result['ml_prediction'] = {
                    'crop': str(prediction),
                    'confidence': confidence
                }
            except Exception as e:
                result['ml_error'] = str(e)
        
        # Test crop info retrieval
        test_crop_info = get_crop_info('rice')
        result['crop_info_available'] = test_crop_info is not None
        result['total_crops_in_dataset'] = len(get_all_crop_names())
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    """Get technical capabilities and statistics"""
    current_month = datetime.datetime.now().month
    total_crops = len(get_all_crop_names())
    
    return jsonify({
        'success': True,
        'stats': {
            'ai_models': {'value': '3+', 'growth': 'Active'},
            'crop_database': {'value': f'{total_crops}+', 'growth': 'Varieties'},
            'api_endpoints': {'value': '15', 'growth': 'Ready'},
            'accuracy_rate': {'value': '94.2%', 'growth': 'ML Model'}
        },
        'last_updated': datetime.datetime.now().isoformat()
    })

@app.route('/api/crops', methods=['GET'])
def get_crops():
    """Get all available crops in the database"""
    try:
        all_crops = []
        for crop_name in get_all_crop_names():
            crop_info = get_crop_info(crop_name)
            if crop_info:
                all_crops.append({
                    'name': crop_name.title(),
                    'emoji': crop_info.get('emoji', '🌱'),
                    'category': crop_info.get('category', 'Unknown'),
                    'season': crop_info.get('season', 'Unknown'),
                    'duration': crop_info.get('duration', 'Unknown')
                })
        
        return jsonify({
            'success': True,
            'total_crops': len(all_crops),
            'crops': all_crops,
            'categories': {
                'cereals': len([c for c in all_crops if c['category'] == 'Cereal']),
                'vegetables': len([c for c in all_crops if c['category'] == 'Vegetable']),
                'fruits': len([c for c in all_crops if c['category'] == 'Fruit']),
                'cash_crops': len([c for c in all_crops if c['category'] == 'Cash Crop']),
                'pulses': len([c for c in all_crops if c['category'] == 'Pulse']),
                'oilseeds': len([c for c in all_crops if c['category'] == 'Oilseed']),
                'spices': len([c for c in all_crops if c['category'] == 'Spice']),
                'others': len([c for c in all_crops if c['category'] not in ['Cereal', 'Vegetable', 'Fruit', 'Cash Crop', 'Pulse', 'Oilseed', 'Spice']])
            }
        })
    except Exception as e:
        logger.error(f"Error fetching crops: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch crops data'
        }), 500

@app.route('/api/crops/<crop_name>', methods=['GET'])
def get_crop_details(crop_name):
    """Get detailed information about a specific crop"""
    try:
        crop_info = get_crop_info(crop_name.lower())
        if not crop_info:
            return jsonify({
                'success': False,
                'error': f'Crop "{crop_name}" not found in database'
            }), 404
        
        return jsonify({
            'success': True,
            'crop_name': crop_name.title(),
            'crop_info': crop_info
        })
    except Exception as e:
        logger.error(f"Error fetching crop details: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch crop details'
        }), 500

@app.route('/api/crops/search', methods=['POST'])
def search_crops_endpoint():
    """Search crops by name or category"""
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Search query is required'
            }), 400
        
        results = search_crops(query)
        crop_details = []
        
        for crop_name in results:
            crop_info = get_crop_info(crop_name)
            if crop_info:
                crop_details.append({
                    'name': crop_name.title(),
                    'emoji': crop_info.get('emoji', '🌱'),
                    'category': crop_info.get('category', 'Unknown'),
                    'season': crop_info.get('season', 'Unknown')
                })
        
        return jsonify({
            'success': True,
            'query': query,
            'total_results': len(crop_details),
            'crops': crop_details
        })
    except Exception as e:
        logger.error(f"Error searching crops: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to search crops'
        }), 500

@app.route('/api/crop-calendar', methods=['GET'])
def crop_calendar():
    """Get comprehensive crop calendar"""
    try:
        current_month = datetime.datetime.now().month
        
        # Comprehensive crop calendar data for Indian agriculture
        crop_calendar_data = {
            'kharif_crops': {
                'season': 'Kharif (June-October)',
                'description': 'Monsoon crops grown during rainy season',
                'crops': [
                    {
                        'name': 'Rice',
                        'emoji': '🌾',
                        'sowing_months': [6, 7],
                        'harvesting_months': [10, 11],
                        'duration_days': 120,
                        'water_requirement': 'High',
                        'soil_type': 'Clay loam',
                        'major_states': ['West Bengal', 'Punjab', 'Uttar Pradesh', 'Andhra Pradesh'],
                        'yield_per_hectare': '3-4 tonnes',
                        'market_price_range': '₹2000-2500/quintal'
                    },
                    {
                        'name': 'Cotton',
                        'emoji': '🌿',
                        'sowing_months': [5, 6],
                        'harvesting_months': [10, 11, 12],
                        'duration_days': 180,
                        'water_requirement': 'Medium',
                        'soil_type': 'Black cotton soil',
                        'major_states': ['Gujarat', 'Maharashtra', 'Telangana', 'Punjab'],
                        'yield_per_hectare': '1.5-2 tonnes',
                        'market_price_range': '₹5500-6500/quintal'
                    },
                    {
                        'name': 'Sugarcane',
                        'emoji': '🎋',
                        'sowing_months': [2, 3, 4],
                        'harvesting_months': [12, 1, 2, 3],
                        'duration_days': 365,
                        'water_requirement': 'Very High',
                        'soil_type': 'Rich loamy soil',
                        'major_states': ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu'],
                        'yield_per_hectare': '70-80 tonnes',
                        'market_price_range': '₹300-350/quintal'
                    }
                ]
            },
            'rabi_crops': {
                'season': 'Rabi (November-April)',
                'description': 'Winter crops grown during dry season',
                'crops': [
                    {
                        'name': 'Wheat',
                        'emoji': '🌾',
                        'sowing_months': [11, 12],
                        'harvesting_months': [3, 4],
                        'duration_days': 120,
                        'water_requirement': 'Medium',
                        'soil_type': 'Well-drained loamy soil',
                        'major_states': ['Uttar Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh'],
                        'yield_per_hectare': '3-4 tonnes',
                        'market_price_range': '₹2100-2400/quintal'
                    },
                    {
                        'name': 'Mustard',
                        'emoji': '🌻',
                        'sowing_months': [10, 11],
                        'harvesting_months': [2, 3],
                        'duration_days': 120,
                        'water_requirement': 'Low',
                        'soil_type': 'Sandy loam',
                        'major_states': ['Rajasthan', 'Haryana', 'Uttar Pradesh', 'West Bengal'],
                        'yield_per_hectare': '1-1.5 tonnes',
                        'market_price_range': '₹4500-5500/quintal'
                    }
                ]
            },
            'zaid_crops': {
                'season': 'Zaid (March-June)',
                'description': 'Summer crops grown with irrigation',
                'crops': [
                    {
                        'name': 'Watermelon',
                        'emoji': '🍉',
                        'sowing_months': [2, 3],
                        'harvesting_months': [5, 6],
                        'duration_days': 90,
                        'water_requirement': 'High',
                        'soil_type': 'Sandy loam',
                        'major_states': ['Uttar Pradesh', 'Rajasthan', 'Punjab', 'Haryana'],
                        'yield_per_hectare': '20-25 tonnes',
                        'market_price_range': '₹800-1500/quintal'
                    },
                    {
                        'name': 'Fodder Maize',
                        'emoji': '🌽',
                        'sowing_months': [3, 4],
                        'harvesting_months': [6, 7],
                        'duration_days': 90,
                        'water_requirement': 'Medium',
                        'soil_type': 'Well-drained soil',
                        'major_states': ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar'],
                        'yield_per_hectare': '40-50 tonnes',
                        'market_price_range': '₹1200-1800/quintal'
                    }
                ]
            }
        }
        
        # Get current month activities
        current_activities = []
        for season_data in crop_calendar_data.values():
            for crop in season_data['crops']:
                if current_month in crop['sowing_months']:
                    current_activities.append({
                        'activity': 'Sowing',
                        'crop': crop['name'],
                        'emoji': crop['emoji'],
                        'priority': 'High'
                    })
                elif current_month in crop['harvesting_months']:
                    current_activities.append({
                        'activity': 'Harvesting',
                        'crop': crop['name'],
                        'emoji': crop['emoji'],
                        'priority': 'High'
                    })
        
        # Smart recommendations based on current month
        smart_recommendations = []
        if current_month in [6, 7, 8]:  # Monsoon season
            smart_recommendations.extend([
                "🌧️ Monitor rainfall levels for optimal rice cultivation",
                "🦠 Watch for fungal diseases due to high humidity",
                "💧 Ensure proper drainage to prevent waterlogging"
            ])
        elif current_month in [11, 12, 1]:  # Winter season
            smart_recommendations.extend([
                "❄️ Protect crops from frost damage",
                "💧 Schedule irrigation as per crop water requirements",
                "🌱 Apply balanced fertilizers for winter crops"
            ])
        elif current_month in [3, 4, 5]:  # Summer season
            smart_recommendations.extend([
                "☀️ Increase irrigation frequency due to high temperatures",
                "🌿 Use mulching to conserve soil moisture",
                "🕐 Schedule farm activities during cooler hours"
            ])
        
        return jsonify({
            'success': True,
            'current_month': current_month,
            'current_activities': current_activities,
            'smart_recommendations': smart_recommendations,
            'crop_calendar': crop_calendar_data,
            'generated_for': 'KrishiMitra AI',
            'last_updated': datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Crop calendar error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch crop calendar data'
        }), 500

@app.route('/api/farmer-advisory', methods=['POST'])
def farmer_advisory():
    """AI-powered farmer advisory system for Smart India Hackathon"""
    try:
        data = request.json
        location = data.get('location', 'India')
        crop_type = data.get('crop_type', 'general')
        issue_type = data.get('issue_type', 'general')
        
        # Smart advisory responses based on issue type
        advisory_responses = {
            'pest_control': [
                "🐛 Integrated Pest Management (IPM) approach is recommended",
                "🌿 Use neem-based organic pesticides as first line of defense",
                "🕷️ Encourage beneficial insects like ladybugs and spiders",
                "📅 Regular monitoring and early detection is crucial",
                "💧 Avoid over-watering which can attract pests"
            ],
            'disease_management': [
                "🦠 Ensure proper crop rotation to break disease cycles",
                "💨 Maintain good air circulation between plants",
                "🌱 Use disease-resistant varieties when available",
                "🧪 Apply copper-based fungicides for fungal diseases",
                "🗑️ Remove and destroy infected plant material immediately"
            ],
            'soil_health': [
                "🧪 Conduct regular soil testing for pH and nutrients",
                "🌿 Add organic matter like compost and vermicompost",
                "🔄 Practice crop rotation to maintain soil fertility",
                "🌱 Use cover crops during fallow periods",
                "⚖️ Balance NPK ratios based on crop requirements"
            ],
            'water_management': [
                "💧 Implement drip irrigation for water efficiency",
                "🕐 Water during early morning or evening hours",
                "🌿 Use mulching to reduce water evaporation",
                "📊 Monitor soil moisture levels regularly",
                "🌧️ Harvest rainwater for irrigation purposes"
            ],
            'fertilizer_management': [
                "🧪 Apply fertilizers based on soil test recommendations",
                "📅 Use split application for nitrogen fertilizers",
                "🌿 Combine organic and inorganic fertilizers",
                "⏰ Apply fertilizers at the right growth stages",
                "💧 Ensure adequate moisture for nutrient uptake"
            ]
        }
        
        # Get relevant advisory
        advisory = advisory_responses.get(issue_type, [
            "🌾 Follow good agricultural practices for better yields",
            "📚 Stay updated with latest farming techniques",
            "🤝 Connect with local agricultural extension officers",
            "📱 Use technology for precision farming",
            "🌍 Consider sustainable farming practices"
        ])
        
        # Add location-specific advice
        location_advice = []
        if 'punjab' in location.lower() or 'haryana' in location.lower():
            location_advice.append("🌾 Focus on wheat-rice rotation system")
            location_advice.append("💧 Manage groundwater depletion issues")
        elif 'maharashtra' in location.lower():
            location_advice.append("🌿 Consider cotton and sugarcane cultivation")
            location_advice.append("🌧️ Plan for monsoon variability")
        elif 'kerala' in location.lower():
            location_advice.append("🥥 Coconut and spice cultivation is ideal")
            location_advice.append("🌧️ Manage high humidity related diseases")
        
        return jsonify({
            'success': True,
            'advisory': advisory,
            'location_specific': location_advice,
            'crop_type': crop_type,
            'issue_type': issue_type,
            'generated_by': 'KrishiMitra AI',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Farmer advisory error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate farmer advisory'
        }), 500

# =====================================================
# IoT SMART FARMING INTEGRATION
# =====================================================

# Store latest IoT sensor data
latest_iot_data = {
    'temperature': 0,
    'humidity': 0,
    'moisture': 0,
    'ph': 7.0,
    'rainfall': 0,
    'timestamp': None
}

@app.route('/api/iot-data', methods=['POST'])
def receive_iot_data():
    """
    Receive real-time sensor data from ESP32 IoT device
    Sensors: DHT11 (temp/humidity), Soil Moisture, pH Sensor
    """
    try:
        data = request.json
        
        # Extract sensor values
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        moisture_raw = int(data.get('moisture', 0))
        ph = float(data.get('ph', 6.5))
        rainfall = float(data.get('rainfall', 0))
        
        # Convert moisture from analog (0-4095) to percentage (0-100%)
        # ESP32 ADC is 12-bit (0-4095), higher value = drier soil
        moisture_percent = 100 - (moisture_raw / 4095 * 100)
        moisture_percent = max(0, min(100, moisture_percent))
        
        # Update latest IoT data
        global latest_iot_data
        latest_iot_data = {
            'temperature': temperature,
            'humidity': humidity,
            'moisture': round(moisture_percent, 1),
            'moisture_raw': moisture_raw,
            'ph': ph,
            'rainfall': rainfall,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Generate smart alerts based on sensor values
        alerts = []
        if moisture_percent < 30:
            alerts.append({
                'type': 'warning',
                'icon': '💧',
                'message': 'Soil is DRY! Irrigation needed immediately.',
                'priority': 'high'
            })
        elif moisture_percent < 50:
            alerts.append({
                'type': 'info',
                'icon': '💧',
                'message': 'Soil moisture is moderate. Consider irrigation soon.',
                'priority': 'medium'
            })
        else:
            alerts.append({
                'type': 'success',
                'icon': '✅',
                'message': 'Soil moisture is optimal for most crops.',
                'priority': 'low'
            })
        
        if temperature > 35:
            alerts.append({
                'type': 'warning',
                'icon': '🌡️',
                'message': 'High temperature! Provide shade or mulch.',
                'priority': 'high'
            })
        elif temperature < 15:
            alerts.append({
                'type': 'warning',
                'icon': '🌡️',
                'message': 'Low temperature! Protect crops from cold.',
                'priority': 'medium'
            })
        
        if ph < 5.5:
            alerts.append({
                'type': 'warning',
                'icon': '⚗️',
                'message': 'Soil is acidic. Add lime to adjust pH.',
                'priority': 'medium'
            })
        elif ph > 7.5:
            alerts.append({
                'type': 'warning',
                'icon': '⚗️',
                'message': 'Soil is alkaline. Add organic matter or sulfur.',
                'priority': 'medium'
            })
        
        # Use ML model for crop prediction with sensor data
        # Use default NPK values (can be enhanced with NPK sensor later)
        nitrogen = 90  # Default N value
        phosphorus = 60  # Default P value
        potassium = 50  # Default K value
        
        prediction_result = None
        if MODEL_AVAILABLE and crop_model and scaler:
            try:
                input_features = np.array([[
                    nitrogen, phosphorus, potassium,
                    temperature, humidity, ph, rainfall if rainfall > 0 else 200
                ]])
                input_scaled = scaler.transform(input_features)
                prediction = crop_model.predict(input_scaled)[0]
                confidence = float(max(crop_model.predict_proba(input_scaled)[0]))
                
                crop_info = get_crop_info(str(prediction).lower())
                
                prediction_result = {
                    'crop': str(prediction).title(),
                    'confidence': round(confidence * 100, 1),
                    'emoji': crop_info.get('emoji', '🌱') if crop_info else '🌱',
                    'season': crop_info.get('season', 'Unknown') if crop_info else 'Unknown',
                    'duration': crop_info.get('duration', 'Unknown') if crop_info else 'Unknown',
                    'tips': crop_info.get('tips', 'Follow good agricultural practices.') if crop_info else ''
                }
            except Exception as e:
                logger.error(f"ML prediction error in IoT: {e}")
        
        logger.info(f"IoT data received: Temp={temperature}°C, Humidity={humidity}%, Moisture={moisture_percent:.1f}%, pH={ph}")
        
        return jsonify({
            'success': True,
            'message': 'IoT data processed successfully',
            'sensor_data': latest_iot_data,
            'alerts': alerts,
            'prediction': prediction_result,
            'timestamp': datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"IoT data processing error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/iot-live', methods=['GET'])
def get_iot_live_data():
    """Get latest IoT sensor data for live dashboard"""
    try:
        if latest_iot_data['timestamp'] is None:
            return jsonify({
                'success': False,
                'message': 'No IoT data received yet. Waiting for sensor transmission.',
                'sensor_data': None
            })
        
        # Check if data is fresh (within last 60 seconds)
        last_update = datetime.datetime.fromisoformat(latest_iot_data['timestamp'])
        is_fresh = (datetime.datetime.now() - last_update).total_seconds() < 60
        
        return jsonify({
            'success': True,
            'sensor_data': latest_iot_data,
            'is_live': is_fresh,
            'status': 'live' if is_fresh else 'stale',
            'message': 'Receiving live sensor data' if is_fresh else 'Sensor data may be outdated'
        })
        
    except Exception as e:
        logger.error(f"Error fetching live IoT data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/iot-status', methods=['GET'])
def iot_device_status():
    """Check IoT device connection status"""
    try:
        if latest_iot_data['timestamp'] is None:
            return jsonify({
                'connected': False,
                'message': 'IoT device not connected',
                'last_seen': None
            })
        
        last_update = datetime.datetime.fromisoformat(latest_iot_data['timestamp'])
        seconds_ago = (datetime.datetime.now() - last_update).total_seconds()
        
        if seconds_ago < 30:
            status = 'connected'
            message = 'IoT device is online and transmitting'
        elif seconds_ago < 120:
            status = 'intermittent'
            message = 'IoT device connection unstable'
        else:
            status = 'disconnected'
            message = 'IoT device offline or out of range'
        
        return jsonify({
            'connected': status == 'connected',
            'status': status,
            'message': message,
            'last_seen': latest_iot_data['timestamp'],
            'seconds_ago': int(seconds_ago)
        })
        
    except Exception as e:
        return jsonify({
            'connected': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting KrishiMitra API on port {port}")
    logger.info(f"Gemini API configured: {bool(GEMINI_API_KEY)}")
    logger.info(f"Weather API configured: {bool(WEATHER_API_KEY)}")
    app.run(host='0.0.0.0', port=port, debug=False)
